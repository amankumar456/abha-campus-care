import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="w-full bg-red-50 border-t-4 border-b-2 border-red-600 px-6 py-4">
      <div className="flex items-start gap-3 max-w-7xl mx-auto">
        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 font-semibold text-base">
            ⚠️ DISCLAIMER: This is not the official website of NIT Warangal. No medical claims or documents issued here are valid for official, legal, or medical purposes. All data is dummy or publicly available from the NIT Warangal website.
          </p>
        </div>
      </div>
    </div>
  );
}
