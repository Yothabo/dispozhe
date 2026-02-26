import React, { useState } from 'react';
import Background from '../components/Background';

const TestPage: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const response = await fetch('http://10.5.141.194:8080/health', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Success: ${JSON.stringify(data)}`);
      } else {
        setResult(`❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testPost = async () => {
    setLoading(true);
    setResult('Testing POST...');
    
    try {
      const response = await fetch('http://10.5.141.194:8080/session/create', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration: 5 }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ POST Success: Session ${data.session_id} created`);
      } else {
        setResult(`❌ POST Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setResult(`❌ POST Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">API Test Page</h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testApi}
              disabled={loading}
              className="w-full px-4 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark disabled:opacity-50"
            >
              Test GET /health
            </button>
            
            <button
              onClick={testPost}
              disabled={loading}
              className="w-full px-4 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark disabled:opacity-50"
            >
              Test POST /session/create
            </button>
          </div>
          
          <div className="bg-navy-light/50 rounded-xl p-4 border border-white/10">
            <pre className="text-white whitespace-pre-wrap break-all">{result || 'Click a button to test'}</pre>
          </div>
          
          <p className="text-grey text-xs mt-4 text-center">
            API URL: http://10.5.141.194:8080
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
