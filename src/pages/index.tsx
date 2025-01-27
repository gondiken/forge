// src/pages/index.tsx
import { useState } from 'react';
import { ContentBox } from '@/components/ContentBox';
import { CategoryInputs } from '@/components/ui/CategoryInputs';

// Define all possible stages in our generation process
type LoadingStage = 
  | 'idle'
  | 'analyzing-brand'
  | 'generating-weblayer'
  | 'generating-campaign'
  | 'definitely-not-slacking'
  | 'finalizing';

// Interface defining the structure of our brand tone analysis results
interface BrandTone {
  missionStatement: string;
  toneOfVoice: string;
  favoriteKeywords: string;
  wordsToAvoid: string;
}

// Interface defining the overall results structure from our API
interface Results {
  brandTone: BrandTone;
  fullJson: Record<string, unknown>;
  rawResponses: {
    brandTone: string;
    weblayer: string;
    emails: string;
  };
}

export default function Home() {
  // State management for form inputs, loading states, and results
  const [brandName, setBrandName] = useState('');
  const [brandInfo, setBrandInfo] = useState('');
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle');
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category1, setCategory1] = useState('');
  const [category2, setCategory2] = useState('');

  // Convert loading stages into user-friendly messages
  const getLoadingText = (stage: LoadingStage) => {
    switch (stage) {
      case 'analyzing-brand':
        return 'Analyzing brand tone...';
      case 'generating-weblayer':
        return 'Generating custom weblayer...';
      case 'generating-campaign':
        return 'Creating omnichannel campaign...';
      case 'definitely-not-slacking':
        return 'Definitely not slacking...';
      case 'finalizing':
        return 'Finalizing assets...';
      default:
        return 'Generate Assets';
    }
  };

  // Main form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingStage('analyzing-brand');

    try {
      // Simulate progression through stages while the API call is happening
      const stageInterval = setInterval(() => {
        setLoadingStage(currentStage => {
          switch (currentStage) {
            case 'analyzing-brand':
              return 'generating-weblayer';
            case 'generating-weblayer':
              return 'generating-campaign';
            case 'generating-campaign':
              return 'definitely-not-slacking';
            case 'definitely-not-slacking':
              return 'finalizing';
            default:
              return currentStage;
          }
        });
      }, 3000);

      // Make the API call
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandName, 
          brandInfo,
          categories: {
            category1: category1 || null,
            category2: category2 || null
          }
        })
      });

      clearInterval(stageInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate assets');
      }

      const data = await response.json();
      setResults({
        ...data,
        brandTone: typeof data.brandTone === 'string' 
          ? JSON.parse(data.brandTone) 
          : data.brandTone,
        rawResponses: data.rawResponses
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error details:', err);
    } finally {
      setLoadingStage('idle');
    }
  };

  // Handle downloads of raw LLM response JSONs
  const handleRawDownload = (type: 'brandTone' | 'weblayer' | 'emails') => {
    if (!results?.rawResponses?.[type]) return;
    
    const blob = new Blob([results.rawResponses[type]], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandName.toLowerCase()}-${type}-raw.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle download of complete JSON asset library
  const handleDownload = () => {
    if (!results?.fullJson) return;
    
    const blob = new Blob([JSON.stringify(results.fullJson, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandName.toLowerCase()}-assets.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Header Section with Logo */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#581C87] mb-2">
                Forge - Demo Prep Agent
              </h1>
              <p className="text-[#9333EA]">
                Generate personalized brand assets and email templates
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <img 
                src="/favicon.svg" 
                alt="Forge Logo" 
                className="w-24 h-24"
                style={{
                  filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))'
                }}
              />
            </div>
          </div>
          
          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#581C87] mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-purple-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#581C87] mb-2">
                What do you know about the brand?
              </label>
              <textarea
                value={brandInfo}
                onChange={(e) => setBrandInfo(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-purple-300 shadow-sm h-32 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter brand information, mission statement, marketing examples..."
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 max-w-lg">
                <CategoryInputs
                  category1={category1}
                  setCategory1={setCategory1}
                  category2={category2}
                  setCategory2={setCategory2}
                />
              </div>
              
              <button
                type="submit"
                disabled={loadingStage !== 'idle'}
                className="flex-1 self-end px-6 py-2 bg-[#9333EA] text-white rounded-xl font-medium text-lg hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
              >
                {loadingStage !== 'idle' ? (
                  <span className="flex items-center justify-center text-white">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {getLoadingText(loadingStage)}
                  </span>
                ) : (
                  'Generate Assets'
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="mt-8">
              <div className="border-t border-purple-200 pt-6">
                <h2 className="text-xl font-semibold text-[#581C87] mb-4">Results</h2>

                {/* Download Asset Button */}
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 py-2 bg-[#9333EA] text-white rounded-xl hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Download Initiative JSON
                </button>

                <br/>

                {/* Brand Tone Analysis */}
                <div className="space-y-6 mb-6">
                  <h3 className="text-sm font-medium text-[#9333EA]">
                    Brand Tone Analysis
                  </h3>
                  
                  <ContentBox 
                    title="Mission Statement"
                    content={results.brandTone.missionStatement}
                  />

                  <ContentBox 
                    title="Tone of Voice"
                    content={results.brandTone.toneOfVoice}
                  />

                  <ContentBox 
                    title="Favorite Keywords"
                    content={results.brandTone.favoriteKeywords}
                  />

                  <ContentBox 
                    title="Words to Avoid"
                    content={results.brandTone.wordsToAvoid}
                  />
                </div>

                {/* Raw Output Downloads */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRawDownload('brandTone')}
                    className="px-3 py-1 bg-[#9333EA] text-white rounded-xl text-sm hover:bg-purple-500"
                  >
                    Raw Brand Tone Output
                  </button>
                  <button
                    onClick={() => handleRawDownload('weblayer')}
                    className="px-3 py-1 bg-[#9333EA] text-white rounded-xl text-sm hover:bg-purple-500"
                  >
                    Raw Weblayer Output
                  </button>
                  <button
                    onClick={() => handleRawDownload('emails')}
                    className="px-3 py-1 bg-[#9333EA] text-white rounded-xl text-sm hover:bg-purple-500"
                  >
                    Raw Emails Output
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}