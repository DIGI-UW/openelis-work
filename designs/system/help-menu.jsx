import React, { useState } from 'react';

export default function HelpMenuMockup() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('docs');

  const tabs = [
    { id: 'docs', label: 'Documentation', icon: '📖' },
    { id: 'catalyst', label: 'Catalyst AI', icon: '✨' },
    { id: 'support', label: 'Support', icon: '🛟' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header bar showing this is a mockup */}
      <div className="bg-blue-900 text-white text-center py-2 text-sm">
        OpenELIS Global - Help Menu Mockup (Side Panel Layout)
      </div>

      <div className="flex h-screen relative overflow-hidden">
        {/* Main Application Area */}
        <div className={`flex-1 bg-white transition-all duration-300 ${isOpen ? 'mr-96' : ''}`}>
          {/* App Header */}
          <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center font-bold">OE</div>
              <span className="font-semibold text-lg">OpenELIS Global</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors ${isOpen ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                title="Help"
              >
                ?
              </button>
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm">JD</div>
            </div>
          </div>

          {/* App Content (placeholder) */}
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Results Entry</h1>
              <p className="text-gray-500">Enter and manage laboratory test results</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-400">
              <div className="text-4xl mb-4">🔬</div>
              <p>Main application content area</p>
              <p className="text-sm mt-2">Users can continue working while the help panel is open</p>
            </div>
          </div>
        </div>

        {/* Help Panel (Slide-out from right) */}
        <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-lg text-gray-800">Help & Support</h2>
            <button 
              onClick={() => setIsOpen(false)} 
              className="w-8 h-8 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Documentation Tab */}
            {activeTab === 'docs' && (
              <div className="p-4 space-y-6">
                {/* Language selector */}
                <div className="flex justify-end">
                  <select className="text-sm border border-gray-200 rounded px-2 py-1 text-gray-600">
                    <option>🌐 English</option>
                    <option>🌐 Français</option>
                  </select>
                </div>

                {/* End User Guide */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">End User Guide</h3>
                  <div className="space-y-2">
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Navigating OpenELIS Global</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Order Entry</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Results Entry</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Validation</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Reports</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Quality Control</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Referred Samples</a>
                  </div>
                </div>

                {/* Admin Guide */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Administrator Guide</h3>
                  <div className="space-y-2">
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ User Management</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Test Catalog Management</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Site Configuration</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Analyzer Configuration</a>
                    <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">→ Interoperability Settings</a>
                  </div>
                </div>

                {/* Training */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Training</h3>
                  <div className="space-y-2">
                    <a href="#" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">
                      <span>→ Training Site</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                    <a href="#" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">
                      <span>→ OpenELIS Wiki</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                    <a href="#" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">
                      <span>→ Community Forum</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                    <a href="#" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">
                      <span>→ Weekly Community Call</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                  </div>
                </div>

                {/* Release Notes */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Release Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="text-sm text-gray-600">Current Version</div>
                    <div className="text-lg font-semibold text-gray-800">v3.1.0</div>
                  </div>
                  <div className="space-y-2">
                    <a href="#" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">
                      <span>→ Latest Release Notes</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                    <a href="#" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">
                      <span>→ Full Changelog</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                    <a href="#" className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 hover:underline py-1">
                      <span>→ Software Roadmap</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Catalyst AI Tab */}
            {activeTab === 'catalyst' && (
              <div className="p-6 flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Catalyst AI Assistant</h3>
                  <div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                    Coming Soon
                  </div>
                  <p className="text-gray-600 text-sm mb-6">
                    Ask questions about your lab data in natural language and get instant insights.
                  </p>
                  
                  {/* Placeholder input */}
                  <div className="w-full">
                    <input 
                      type="text"
                      disabled
                      placeholder="Ask a question about your lab data..."
                      className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                    <button 
                      disabled
                      className="mt-2 w-full py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
              <div className="p-4 space-y-4">
                {/* Custom Message */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Support Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM (Local Time)
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    For after-hours emergencies, please call: +1-555-0199
                  </p>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Contact</h3>
                    <p className="text-gray-800 font-medium">IT Support Team</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone</h3>
                    <a href="tel:+15550123" className="text-blue-600 hover:underline flex items-center gap-2">
                      <span>📞</span> +1-555-0123
                    </a>
                    <a href="tel:+15550124" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                      <span>📞</span> +1-555-0124 (Backup)
                    </a>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email</h3>
                    <a href="mailto:support@lab.org" className="text-blue-600 hover:underline flex items-center gap-2">
                      <span>✉️</span> support@lab.org
                    </a>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Online Support</h3>
                    <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                      <span>🎫</span> Submit a Support Ticket
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
