export const VOICES = Object.freeze({
  "expr-voice-2-m": {
    name: "Bella",
    language: "en-us",
    gender: "Male",
    traits: "🔥",
    targetQuality: "A",
    overallGrade: "A-",
  },
  af_heart: {
    name: "Heart",
    language: "en-us",
    gender: "Female",
    traits: "❤️",
    targetQuality: "A",
    overallGrade: "A",
  },
  af_alloy: {
    name: "Alloy",
    language: "en-us",
    gender: "Female",
    targetQuality: "B",
    overallGrade: "C",
  },
  af_aoede: {
    name: "Aoede",
    language: "en-us",
    gender: "Female",
    targetQuality: "B",
    overallGrade: "C+",
  },
  af_bella: {
    name: "Bella",
    language: "en-us",
    gender: "Female",
    traits: "🔥",
    targetQuality: "A",
    overallGrade: "A-",
  },
  af_jessica: {
    name: "Jessica",
    language: "en-us",
    gender: "Female",
    targetQuality: "C",
    overallGrade: "D",
  },
  af_kore: {
    name: "Kore",
    language: "en-us",
    gender: "Female",
    targetQuality: "B",
    overallGrade: "C+",
  },
  af_nicole: {
    name: "Nicole",
    language: "en-us",
    gender: "Female",
    traits: "🎧",
    targetQuality: "B",
    overallGrade: "B-",
  },
  af_nova: {
    name: "Nova",
    language: "en-us",
    gender: "Female",
    targetQuality: "B",
    overallGrade: "C",
  },
  af_river: {
    name: "River",
    language: "en-us",
    gender: "Female",
    targetQuality: "C",
    overallGrade: "D",
  },
  af_sarah: {
    name: "Sarah",
    language: "en-us",
    gender: "Female",
    targetQuality: "B",
    overallGrade: "C+",
  },
  af_sky: {
    name: "Sky",
    language: "en-us",
    gender: "Female",
    targetQuality: "B",
    overallGrade: "C-",
  },
  am_adam: {
    name: "Adam",
    language: "en-us",
    gender: "Male",
    targetQuality: "D",
    overallGrade: "F+",
  },
  am_echo: {
    name: "Echo",
    language: "en-us",
    gender: "Male",
    targetQuality: "C",
    overallGrade: "D",
  },
  am_eric: {
    name: "Eric",
    language: "en-us",
    gender: "Male",
    targetQuality: "C",
    overallGrade: "D",
  },
  am_fenrir: {
    name: "Fenrir",
    language: "en-us",
    gender: "Male",
    targetQuality: "B",
    overallGrade: "C+",
  },
  am_liam: {
    name: "Liam",
    language: "en-us",
    gender: "Male",
    targetQuality: "C",
    overallGrade: "D",
  },
  am_michael: {
    name: "Michael",
    language: "en-us",
    gender: "Male",
    targetQuality: "B",
    overallGrade: "C+",
  },
  am_onyx: {
    name: "Onyx",
    language: "en-us",
    gender: "Male",
    targetQuality: "C",
    overallGrade: "D",
  },
  am_puck: {
    name: "Puck",
    language: "en-us",
    gender: "Male",
    targetQuality: "B",
    overallGrade: "C+",
  },
  am_santa: {
    name: "Santa",
    language: "en-us",
    gender: "Male",
    targetQuality: "C",
    overallGrade: "D-",
  },
  bf_emma: {
    name: "Emma",
    language: "en-gb",
    gender: "Female",
    traits: "🚺",
    targetQuality: "B",
    overallGrade: "B-",
  },
  bf_isabella: {
    name: "Isabella",
    language: "en-gb",
    gender: "Female",
    targetQuality: "B",
    overallGrade: "C",
  },
  bm_george: {
    name: "George",
    language: "en-gb",
    gender: "Male",
    targetQuality: "B",
    overallGrade: "C",
  },
  bm_lewis: {
    name: "Lewis",
    language: "en-gb",
    gender: "Male",
    targetQuality: "C",
    overallGrade: "D+",
  },
  bf_alice: {
    name: "Alice",
    language: "en-gb",
    gender: "Female",
    traits: "🚺",
    targetQuality: "C",
    overallGrade: "D",
  },
  bf_lily: {
    name: "Lily",
    language: "en-gb",
    gender: "Female",
    traits: "🚺",
    targetQuality: "C",
    overallGrade: "D",
  },
  bm_daniel: {
    name: "Daniel",
    language: "en-gb",
    gender: "Male",
    traits: "🚹",
    targetQuality: "C",
    overallGrade: "D",
  },
  bm_fable: {
    name: "Fable",
    language: "en-gb",
    gender: "Male",
    traits: "🚹",
    targetQuality: "B",
    overallGrade: "C",
  },
});

//const VOICE_DATA_URL = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices";
const VOICE_DATA_URL = "https://huggingface.co/sjovanovic/kitten-tts-nano-0.8/resolve/main/voices"

const KITTEN_TTS = true
const NPZ_VOICES_FILE = true

/**
 *
 * @param {keyof typeof VOICES} id
 * @returns {Promise<ArrayBufferLike>}
 */
async function getVoiceFile(id) {
  const url = NPZ_VOICES_FILE ? `${VOICE_DATA_URL}/voices.npz` : `${VOICE_DATA_URL}/${id}.bin`;
  let cache;
  try {
    cache = await caches.open("kitten-voices");
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      return await cachedResponse.arrayBuffer();
    }
  } catch (e) {
    console.warn("Unable to open cache", e);
  }

  // No cache, or cache failed to open. Fetch the file.
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  if (cache) {
    try {
      // NOTE: We use `new Response(buffer, ...)` instead of `response.clone()` to handle LFS files
      await cache.put(
        url,
        new Response(buffer, {
          headers: response.headers,
        }),
      );
    } catch (e) {
      console.warn("Unable to cache file", e);
    }
  }

  return buffer;
}



async function fetchAndParseNPZ(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const view = new DataView(buffer);
  const result = {};

  let offset = 0;

  // ZIP file format starts with 'PK\x03\x04'
  while (offset < buffer.byteLength) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) break; // End of Local File Headers

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    
    const fileName = new TextDecoder().decode(buffer.slice(offset + 30, offset + 30 + fileNameLen));
    const fileDataStart = offset + 30 + fileNameLen + extraLen;
    let fileData = buffer.slice(fileDataStart, fileDataStart + compressedSize);

    // Handle Compression (Method 8 is Deflate)
    if (compressionMethod === 8) {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(fileData);
      writer.close();
      fileData = await new Response(ds.readable).arrayBuffer();
    }

    // Parse NPY format if it's an array file
    if (fileName.endsWith('.npy')) {
      result[fileName.replace('.npy', '')] = parseNPY(fileData);
    }

    offset = fileDataStart + compressedSize;
  }

  return result;

  /**
   * Internal helper to parse the NPY binary format
   */
  function parseNPY(buf) {
    const headerLen = new DataView(buf).getUint16(8, true);
    const headerStr = new TextDecoder().decode(buf.slice(10, 10 + headerLen));
    
    // Extract metadata using regex (Professional alternative to eval-ing Python dict strings)
    const descr = headerStr.match(/'descr':\s*'([^']+)'/)[1];
    const shape = headerStr.match(/'shape':\s*\(([^)]+)\)/)[1]
      .split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

      const dataOffset = 10 + headerLen;
      const typeMap = {
        '|u1': Uint8Array, '<u4': Uint32Array, '<i4': Int32Array,
        '<f4': Float32Array, '<f8': Float64Array
      };
  
      const TypedArray = typeMap[descr] || Float32Array;
      
      // Calculate total number of elements from the shape [x, y, z]
      const totalElements = shape.reduce((a, b) => a * b, 1);
      
      // Use the constructor that takes (buffer, byteOffset, length)
      // This is more memory efficient than .slice() as it views the same memory
      return {
        data: new TypedArray(buf, dataOffset, totalElements),
        shape: shape
      };
  }
}




const VOICE_CACHE = new Map();
export async function getVoiceData(voice) {
  if (VOICE_CACHE.has(voice)) {
    return VOICE_CACHE.get(voice);
  }

  if(NPZ_VOICES_FILE){
    // Kitten uses npz file format for voices (zipped numpy arrays)
    let url = 'https://huggingface.co/sjovanovic/kitten-tts-nano-0.8/resolve/main/voices/voices.npz'
    let obj = await fetchAndParseNPZ(url)
    let keys = Object.keys(obj)
    if(keys.length){
        // obj.myArray.shape is the dimensions
        console.log('dimensions', obj[keys[0]].shape)
        // obj.myArray.data is the TypedArray
        const buffer = obj[keys[0]].data
        VOICE_CACHE.set(voice, buffer);
        return buffer;
    }else{
      throw Error('No voices found in ', url)
    }
  }else{
    const buffer = new Float32Array(await getVoiceFile(voice));
    VOICE_CACHE.set(voice, buffer);
    return buffer;
  }
}
