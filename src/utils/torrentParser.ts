/**
 * Clean, lightweight, zero-dependency Torrent & Magnet Parser
 * Supports Magnet URIs, Info Hashes, and .torrent binary bencode decoding with SHA-1 hash calculation.
 */

export interface TorrentFileItem {
  name: string;
  path: string;
  length: number;
  isVideo: boolean;
  isSubtitle: boolean;
  isAudio: boolean;
}

export interface ParsedTorrentInfo {
  name: string;
  infoHash: string;
  magnetURI: string;
  totalLength: number;
  files: TorrentFileItem[];
  trackers: string[];
  pieceLength?: number;
  piecesCount?: number;
  createdBy?: string;
  creationDate?: Date;
  comment?: string;
}

/**
 * Format raw bytes into human readable string (e.g. "1.42 GB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Helper to identify video / audio / subtitle extensions
 */
export function getFileTypeFlags(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v', 'flv', 'ts', 'vob', 'wmv'];
  const subtitleExts = ['srt', 'vtt', 'sub', 'sbv', 'ass', 'ssa'];
  const audioExts = ['mp3', 'aac', 'flac', 'wav', 'ogg', 'm4a', 'wma', 'opus'];

  return {
    isVideo: videoExts.includes(ext),
    isSubtitle: subtitleExts.includes(ext),
    isAudio: audioExts.includes(ext),
  };
}

/**
 * Parse a magnet URI, infohash, or .torrent URL into structured torrent metadata.
 * Returns ParsedTorrentInfo on success, or null if invalid format.
 */
export function parseMagnetURI(input: string): ParsedTorrentInfo {
  let trimmed = input.trim();

  // Strip surrounding quotes or brackets if present
  trimmed = trimmed.replace(/^["'<“]+|["'>”]+$/g, '').trim();

  // Handle URL-encoded magnet links
  if (trimmed.toLowerCase().includes('magnet%3a%3f')) {
    try {
      trimmed = decodeURIComponent(trimmed);
    } catch {
      // ignore decoding error
    }
  }

  // If input contains a magnet link inside text or URL (e.g. href="magnet:?..." or https://...?magnet=...)
  const magnetPos = trimmed.search(/magnet:\?/i);
  if (magnetPos !== -1) {
    trimmed = trimmed.substring(magnetPos).split(/["'\s<>]/)[0];
  } else if (trimmed.includes('#magnet=') || trimmed.includes('?magnet=')) {
    const match = trimmed.match(/[#?]magnet=([^&"'\s<>]+)/i);
    if (match && match[1]) {
      try {
        trimmed = decodeURIComponent(match[1]);
      } catch {
        trimmed = match[1];
      }
    }
  }

  // Handle direct HTTP/HTTPS .torrent file URLs
  if (/^https?:\/\/.+/i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const pathname = url.pathname;
      const fileName = pathname.split('/').pop() || 'Remote Torrent';
      const cleanTitle = decodeURIComponent(fileName).replace(/\.torrent$/i, '') || 'Remote Torrent';
      return {
        name: cleanTitle,
        infoHash: '',
        magnetURI: trimmed,
        totalLength: 0,
        files: [
          {
            name: cleanTitle,
            path: cleanTitle,
            length: 0,
            isVideo: true,
            isSubtitle: false,
            isAudio: false,
          },
        ],
        trackers: getDefaultTrackers(),
      };
    } catch {
      // not a valid URL, continue to hash checks
    }
  }

  // Handle urn:btih: or btih: prefix
  const btihMatch = trimmed.match(/^(?:urn:)?btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/i);
  if (btihMatch) {
    const rawHash = btihMatch[1];
    const infoHash = rawHash.length === 40 ? rawHash.toLowerCase() : rawHash.toUpperCase();
    const magnetURI = `magnet:?xt=urn:btih:${infoHash}`;
    return {
      name: `Torrent (${infoHash.slice(0, 8)}...)`,
      infoHash,
      magnetURI,
      totalLength: 0,
      files: [],
      trackers: getDefaultTrackers(),
    };
  }

  // If input is a raw 40-character hex infohash (with optional spaces or dashes)
  const cleanHex = trimmed.replace(/[\s-]/g, '');
  if (/^[0-9a-fA-F]{40}$/.test(cleanHex)) {
    const infoHash = cleanHex.toLowerCase();
    const magnetURI = `magnet:?xt=urn:btih:${infoHash}`;
    return {
      name: `Torrent (${infoHash.slice(0, 8)}...)`,
      infoHash,
      magnetURI,
      totalLength: 0,
      files: [],
      trackers: getDefaultTrackers(),
    };
  }

  // If input is a raw 32-character base32 infohash
  if (/^[2-7a-zA-Z]{32}$/.test(cleanHex)) {
    const infoHash = cleanHex.toUpperCase();
    const magnetURI = `magnet:?xt=urn:btih:${infoHash}`;
    return {
      name: `Torrent (${infoHash.slice(0, 8)}...)`,
      infoHash,
      magnetURI,
      totalLength: 0,
      files: [],
      trackers: getDefaultTrackers(),
    };
  }

  // Check if it starts with magnet:? (case-insensitive)
  if (!/^magnet:\?/i.test(trimmed)) {
    throw new Error('Please enter a valid magnet link (magnet:?xt=urn:btih:...), 40-char info hash, or .torrent URL.');
  }

  const query = trimmed.substring(trimmed.indexOf('?') + 1);
  const params = new URLSearchParams(query);

  let infoHash = '';
  // Check xt parameter(s)
  const xts = params.getAll('xt');
  for (const xt of xts) {
    const match = xt.match(/urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/i);
    if (match) {
      infoHash = match[1].toLowerCase();
      break;
    }
  }

  if (!infoHash) {
    // If no explicit xt match, look for 40-character hex in the query string
    const hexFallback = query.match(/([a-fA-F0-9]{40})/);
    if (hexFallback) {
      infoHash = hexFallback[1].toLowerCase();
    } else {
      throw new Error('Magnet URI does not contain a valid BTIH info hash.');
    }
  }

  const name = params.get('dn') ? decodeURIComponent(params.get('dn') || '') : `Torrent (${infoHash.slice(0, 8)})`;
  const trackers = params.getAll('tr').map((t) => decodeURIComponent(t));
  if (trackers.length === 0) {
    trackers.push(...getDefaultTrackers());
  }

  // Format canonical magnet link with trackers included
  let canonicalMagnet = trimmed;
  if (!trimmed.includes('tr=')) {
    canonicalMagnet = `${trimmed}&${trackers.map((tr) => `tr=${encodeURIComponent(tr)}`).join('&')}`;
  }

  return {
    name,
    infoHash,
    magnetURI: canonicalMagnet,
    totalLength: 0,
    files: [
      {
        name,
        path: name,
        length: 0,
        isVideo: true,
        isSubtitle: false,
        isAudio: false,
      },
    ],
    trackers,
  };
}

/**
 * Common public high-speed trackers for peer discovery
 */
export function getDefaultTrackers(): string[] {
  return [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://explodie.org:6969/announce',
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.fastcast.nz',
  ];
}

/**
 * Pure TypeScript Bencode Decoder
 * Fast, recursive decoder supporting binary buffers and utf-8 string decoding
 */
class BencodeDecoder {
  private data: Uint8Array;
  private pos: number = 0;
  private textDecoder = new TextDecoder('utf-8');

  constructor(buffer: ArrayBuffer | Uint8Array) {
    this.data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.pos = 0;
  }

  public decode(): any {
    if (this.pos >= this.data.length) return null;
    const char = String.fromCharCode(this.data[this.pos]);

    if (char === 'i') {
      return this.decodeInt();
    } else if (char === 'l') {
      return this.decodeList();
    } else if (char === 'd') {
      return this.decodeDict();
    } else if (char >= '0' && char <= '9') {
      return this.decodeString();
    }
    throw new Error(`Unexpected bencode token '${char}' at byte offset ${this.pos}`);
  }

  private decodeInt(): number {
    this.pos++; // skip 'i'
    const start = this.pos;
    while (this.pos < this.data.length && this.data[this.pos] !== 0x65 /* 'e' */) {
      this.pos++;
    }
    const numStr = this.textDecoder.decode(this.data.subarray(start, this.pos));
    this.pos++; // skip 'e'
    return parseInt(numStr, 10);
  }

  private decodeString(asRaw: boolean = false): string | Uint8Array {
    const colonIdx = this.data.indexOf(0x3a /* ':' */, this.pos);
    if (colonIdx === -1) throw new Error('Malformed bencode string: missing colon');
    const lengthStr = this.textDecoder.decode(this.data.subarray(this.pos, colonIdx));
    const length = parseInt(lengthStr, 10);
    this.pos = colonIdx + 1;
    const rawBytes = this.data.subarray(this.pos, this.pos + length);
    this.pos += length;

    if (asRaw) return rawBytes;
    try {
      return this.textDecoder.decode(rawBytes);
    } catch {
      return rawBytes.toString();
    }
  }

  private decodeList(): any[] {
    this.pos++; // skip 'l'
    const list: any[] = [];
    while (this.pos < this.data.length && this.data[this.pos] !== 0x65 /* 'e' */) {
      list.push(this.decode());
    }
    this.pos++; // skip 'e'
    return list;
  }

  private decodeDict(): Record<string, any> {
    this.pos++; // skip 'd'
    const dict: Record<string, any> = {};
    while (this.pos < this.data.length && this.data[this.pos] !== 0x65 /* 'e' */) {
      const key = this.decodeString() as string;
      dict[key] = this.decode();
    }
    this.pos++; // skip 'e'
    return dict;
  }

  /**
   * Find raw byte range of 'info' dictionary in .torrent file
   * for calculating standard SHA-1 infoHash
   */
  public static extractInfoDictionaryBytes(data: Uint8Array): Uint8Array {
    // Look for '4:info'
    const marker = new TextEncoder().encode('4:info');
    let startIdx = -1;
    for (let i = 0; i < data.length - marker.length; i++) {
      let match = true;
      for (let j = 0; j < marker.length; j++) {
        if (data[i + j] !== marker[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        startIdx = i + marker.length;
        break;
      }
    }

    if (startIdx === -1) {
      throw new Error('Could not find info dictionary in .torrent file');
    }

    // Now find the end of this bencoded dictionary by tracking nest depth
    let depth = 0;
    let pos = startIdx;

    if (data[pos] !== 0x64 /* 'd' */) {
      throw new Error('Info dictionary does not start with "d"');
    }

    while (pos < data.length) {
      const byte = data[pos];
      if (byte === 0x64 /* 'd' */ || byte === 0x6c /* 'l' */) {
        depth++;
        pos++;
      } else if (byte === 0x65 /* 'e' */) {
        depth--;
        pos++;
        if (depth === 0) {
          // Reached end of outermost dict!
          return data.subarray(startIdx, pos);
        }
      } else if (byte === 0x69 /* 'i' */) {
        pos++;
        while (pos < data.length && data[pos] !== 0x65) pos++;
        pos++; // skip 'e'
      } else if (byte >= 0x30 && byte <= 0x39 /* 0-9 */) {
        // String length prefix
        const colonIdx = data.indexOf(0x3a, pos);
        if (colonIdx === -1) break;
        const lenStr = new TextDecoder().decode(data.subarray(pos, colonIdx));
        const len = parseInt(lenStr, 10);
        pos = colonIdx + 1 + len;
      } else {
        pos++;
      }
    }

    throw new Error('Failed to find matching end of info dictionary');
  }
}

/**
 * Parse an ArrayBuffer / File of a .torrent file into a full ParsedTorrentInfo
 */
export async function parseTorrentFile(buffer: ArrayBuffer): Promise<ParsedTorrentInfo> {
  const data = new Uint8Array(buffer);
  const decoder = new BencodeDecoder(data);
  const root = decoder.decode();

  if (!root || typeof root !== 'object' || !root.info) {
    throw new Error('Invalid .torrent file: Missing root info dictionary');
  }

  // Calculate SHA-1 hash of raw info bytes
  const infoBytes = BencodeDecoder.extractInfoDictionaryBytes(data);
  const infoCopy = new Uint8Array(infoBytes.length);
  infoCopy.set(infoBytes);
  const hashBuffer = await crypto.subtle.digest('SHA-1', infoCopy);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const infoHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const info = root.info;
  const name = typeof info['name.utf-8'] === 'string' ? info['name.utf-8'] : typeof info.name === 'string' ? info.name : `Torrent ${infoHash.slice(0, 8)}`;

  // Parse files
  const files: TorrentFileItem[] = [];
  let totalLength = 0;

  if (Array.isArray(info.files)) {
    // Multi-file torrent
    for (const f of info.files) {
      const fileLength = typeof f.length === 'number' ? f.length : 0;
      totalLength += fileLength;
      const pathSegments: string[] = Array.isArray(f['path.utf-8'])
        ? f['path.utf-8']
        : Array.isArray(f.path)
        ? f.path
        : ['unnamed'];
      const filePath = pathSegments.join('/');
      const fileName = pathSegments[pathSegments.length - 1] || 'unnamed';
      const flags = getFileTypeFlags(fileName);

      files.push({
        name: fileName,
        path: filePath,
        length: fileLength,
        ...flags,
      });
    }
  } else {
    // Single-file torrent
    const fileLength = typeof info.length === 'number' ? info.length : 0;
    totalLength = fileLength;
    const flags = getFileTypeFlags(name);
    files.push({
      name,
      path: name,
      length: fileLength,
      ...flags,
    });
  }

  // Gather trackers
  const trackers: string[] = [];
  if (typeof root.announce === 'string' && root.announce.trim()) {
    trackers.push(root.announce.trim());
  }
  if (Array.isArray(root['announce-list'])) {
    for (const tier of root['announce-list']) {
      if (Array.isArray(tier)) {
        for (const tr of tier) {
          if (typeof tr === 'string' && tr.trim() && !trackers.includes(tr.trim())) {
            trackers.push(tr.trim());
          }
        }
      } else if (typeof tier === 'string' && !trackers.includes(tier)) {
        trackers.push(tier);
      }
    }
  }

  if (trackers.length === 0) {
    trackers.push(...getDefaultTrackers());
  }

  // Construct standard magnet URI
  const magnetURI = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(name)}${trackers
    .map((tr) => `&tr=${encodeURIComponent(tr)}`)
    .join('')}`;

  return {
    name,
    infoHash,
    magnetURI,
    totalLength,
    files,
    trackers,
    pieceLength: typeof info['piece length'] === 'number' ? info['piece length'] : undefined,
    piecesCount: info.pieces ? Math.floor(info.pieces.length / 20) : undefined,
    createdBy: typeof root['created by'] === 'string' ? root['created by'] : undefined,
    creationDate: typeof root['creation date'] === 'number' ? new Date(root['creation date'] * 1000) : undefined,
    comment: typeof root.comment === 'string' ? root.comment : undefined,
  };
}
