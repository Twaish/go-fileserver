const fileInput = document.getElementById('fileInput');
const dropZoneText = document.getElementById('dropZoneText');

window.addEventListener('DOMContentLoaded', () => {
  loadSharedFiles();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    dropZoneText.innerText = fileInput.files[0].name;
  }
});

function loadSharedFiles() {
  const fileListEl = document.getElementById('fileList');
  fileListEl.innerHTML = '<li class="no-files">Loading files...</li>';

  fetch('/api/files')
    .then(response => response.json())
    .then(files => {
      fileListEl.innerHTML = '';
      
      if (!files || files.length === 0) {
        fileListEl.innerHTML = '<li class="no-files">No files available yet.</li>';
        return;
      }

      files.forEach(filename => {
        const li = document.createElement('li');
        li.className = 'file-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.innerText = filename;

        const downloadLink = document.createElement('a');
        downloadLink.className = 'download-btn';
        downloadLink.href = `/shared/${encodeURIComponent(filename)}`;
        downloadLink.download = filename;
        downloadLink.innerText = 'Download';

        li.appendChild(nameSpan);
        li.appendChild(downloadLink);
        fileListEl.appendChild(li);
      });
    })
    .catch(err => {
      console.error('Error fetching files:', err);
      fileListEl.innerHTML = '<li class="no-files" style="color:red;">Failed to load files</li>';
    });
}

function uploadFile() {
  const file = fileInput.files[0];
  if (!file) { alert("Please select a file first!"); return; }

  const xhr = new XMLHttpRequest();
  const wrapper = document.getElementById('progressWrapper');
  const fill = document.getElementById('progressFill');
  const status = document.getElementById('status');

  wrapper.style.display = 'block';
  fill.style.backgroundColor = '#00cc66';

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      fill.style.width = percent + '%';
      status.innerText = 'Streaming... ' + percent + '%';
    }
  });

  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      status.innerText = '✅ Success! Stored in /uploads.';
      fill.style.width = '100%';
    } else {
      status.innerText = '❌ Error: ' + xhr.responseText;
      fill.style.backgroundColor = '#ff3333';
    }
  });

  xhr.open('POST', '/upload', true);
  xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
  xhr.send(file);
}