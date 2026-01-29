import { Loader, LoadingManager } from 'three'
import { FontLoader, Font } from 'three-stdlib'
import { TTFLoader } from 'three-stdlib'

/**
 * Custom loader that handles both standard .ttf/.woff fonts (via TTFLoader)
 * and legacy Three.js .json fonts (via FontLoader).
 */
export class UniversalFontLoader extends Loader {
  private fontLoader: FontLoader
  private ttfLoader: TTFLoader

  constructor(manager?: LoadingManager) {
    super(manager)
    this.fontLoader = new FontLoader(manager)
    this.ttfLoader = new TTFLoader(manager)
  }

  load(url: string, onLoad: (font: Font) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void) {
    // Check file extension (basic check)
    const isTTF = url.toLowerCase().endsWith('.ttf') || url.toLowerCase().endsWith('.woff') || url.includes('fonts.gstatic.com')
    
    if (isTTF) {
      this.ttfLoader.load(
        url,
        (json) => {
          // Parse the TTF JSON to a Three.js Font
          const font = this.fontLoader.parse(json as any)
          onLoad(font)
        },
        onProgress,
        onError
      )
    } else {
      // Default to JSON loader
      this.fontLoader.load(url, onLoad, onProgress, onError)
    }
  }

  parse(json: any): Font {
    return this.fontLoader.parse(json)
  }
}

// Singleton instance for convenience if needed, 
// though useLoader usually instantiates its own.
export const universalFontLoader = new UniversalFontLoader()
