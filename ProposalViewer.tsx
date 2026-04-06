import React from 'react';

const ProposalViewer = () => {
  const redirectToGoogleDrive = () => {
    window.location.href = 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID';
  };

  React.useEffect(() => {
    redirectToGoogleDrive();
  }, []);

  return <div>Redirecting...</div>;
};

export default ProposalViewer;