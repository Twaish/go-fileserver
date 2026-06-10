const fileInput = document.getElementById('fileInput');
const dropZoneText = document.getElementById('dropZoneText');

window.addEventListener('DOMContentLoaded', () => {
  loadSharedFiles();
});

fileInput.addEventListener('change', () => {
  const count = fileInput.files.length;
  if (count === 1) {
    dropZoneText.innerText = fileInput.files[0].name;
  } else if (count > 1) {
    dropZoneText.innerText = `${count} files selected`;
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

function uploadFiles() {
  const files = fileInput.files;
  if (files.length === 0) { alert("Please select one or more files first!"); return; }

  const queueContainer = document.getElementById('uploadQueue');
  queueContainer.innerHTML = '';

  Array.from(files).forEach(file => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'queue-item';

    const metaDiv = document.createElement('div');
    metaDiv.className = 'queue-meta';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'queue-name';
    nameSpan.innerText = file.name;

    const statusSpan = document.createElement('span');
    statusSpan.className = 'queue-status';
    statusSpan.innerText = '0%';

    const barDiv = document.createElement('div');
    barDiv.className = 'queue-bar';

    const fillDiv = document.createElement('div');
    fillDiv.className = 'queue-fill';

    metaDiv.appendChild(nameSpan);
    metaDiv.appendChild(statusSpan);
    barDiv.appendChild(fillDiv);
    itemDiv.appendChild(metaDiv);
    itemDiv.appendChild(barDiv);
    queueContainer.appendChild(itemDiv);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        fillDiv.style.width = percent + '%';
        statusSpan.innerText = percent + '%';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        statusSpan.innerText = '✅ Done';
        statusSpan.style.color = '#00cc66';
      } else {
        statusSpan.innerText = '❌ Failed';
        statusSpan.style.color = '#ff3333';
        fillDiv.style.backgroundColor = '#ff3333';
      }
    });

    xhr.open('POST', '/upload', true);
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.send(file);
  });
}