import React from 'react';

const ProposalViewer = () => {
  React.useEffect(() => {
    // Redirect to Google Drive folder
    window.location.href = 'https://drive.google.com/drive/folders/15IKAouMMxqatLyjYiEw-ael1imQFu-z5?usp=sharing';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Redirecting to Google Drive...</p>
      </div>
    </div>
  );
};

export default ProposalViewer;