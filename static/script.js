document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const getBtn = document.getElementById('getBtn');
    const progressFill = document.querySelector('.progress-fill');
    const status = document.getElementById('status');
    let latestResizedImage = null;

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        const formData = new FormData();
        for (let file of fileInput.files) {
            formData.append('files[]', file);
        }
        status.textContent = 'Processing...';
        progressFill.style.width = '0%';

        fetch('http://127.0.0.1:5000/upload', { method: 'POST', body: formData })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Upload Response:', data);
                if (data.progress === 100 && data.previews && data.previews.length > 0) {
                    const preview = data.previews[0];
                    latestResizedImage = `http://127.0.0.1:5000/${preview.resized}`;
                    progressFill.style.width = '100%';
                    status.textContent = 'Upload Complete';
                } else {
                    status.textContent = 'No preview data';
                }
            })
            .catch(error => {
                console.error('Upload Error:', error);
                status.textContent = 'Error during upload';
            });
    });

    getBtn.addEventListener('click', () => {
        if (!latestResizedImage) {
            status.textContent = 'Upload an image first';
            return;
        }
        status.textContent = 'Preparing download...';
        progressFill.style.width = '50%';

        fetch(latestResizedImage)
            .then(response => response.blob())
            .then(blob => {
                // Create a new URL for the blob object
                const url = window.URL.createObjectURL(blob);
                
                // Create a temporary anchor element and set the download attribute
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const filename = latestResizedImage.split('/').pop();
                a.download = filename;

                // Programmatically click the anchor to trigger the download
                document.body.appendChild(a);
                a.click();

                // Clean up by revoking the URL and removing the anchor
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                status.textContent = 'Download initiated!';
                progressFill.style.width = '100%';
            })
            .catch(() => {
                status.textContent = 'Error during download.';
                progressFill.style.width = '0%';
            });
    });
});