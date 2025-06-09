document.addEventListener("DOMContentLoaded", () => {
    // 🔥 문서 전체에 드롭시 새 탭 열리는 현상 방지!
    window.addEventListener("dragover", function(e) {
        e.preventDefault();
    }, false);
    window.addEventListener("drop", function(e) {
        e.preventDefault();
    }, false);

    const dropArea = document.getElementById("drop-area");
    const progressDiv = document.getElementById("progress");

    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.style.borderColor = "#00aaff";
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.style.borderColor = "#aaa";
    });

    dropArea.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropArea.style.borderColor = "#aaa";

        const file = e.dataTransfer.files[0];
        if (!file) return;

        // ======= Chunked Upload Start =======
        const chunkSize = 1 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / chunkSize);
        const uploadId = Math.random().toString(36).slice(2);

        progressDiv.innerHTML = "";
        const percentBar = document.createElement('div');
        percentBar.style.height = '10px';
        percentBar.style.background = '#eee';
        percentBar.style.borderRadius = '5px';
        percentBar.style.margin = '10px 0';
        progressDiv.appendChild(percentBar);

        const percentFill = document.createElement('div');
        percentFill.style.height = '100%';
        percentFill.style.background = '#00aaff';
        percentFill.style.width = '0%';
        percentFill.style.borderRadius = '5px';
        percentBar.appendChild(percentFill);

        const percentText = document.createElement('div');
        percentText.style.margin = '5px 0';
        percentText.textContent = "업로드 중... (0%)";
        progressDiv.appendChild(percentText);

        let totalSent = 0;
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(file.size, start + chunkSize);
            const chunk = file.slice(start, end);

            let formData = new FormData();
            formData.append('file', chunk, file.name);
            formData.append('filename', file.name);
            formData.append('chunk_index', i);
            formData.append('total_chunks', totalChunks);
            formData.append('upload_id', uploadId);

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/upload-chunk");
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const sent = totalSent + event.loaded;
                        const percent = Math.round((sent / file.size) * 100);
                        percentFill.style.width = percent + "%";
                        percentText.textContent = `업로드 중... (${percent}%)`;
                    }
                };
                xhr.onload = () => {
                    totalSent += chunk.size;
                    resolve();
                };
                xhr.onerror = () => {
                    percentText.textContent = "❌ 업로드 실패!";
                    reject();
                };
                xhr.send(formData);
            });
        }

        // Merge chunks
        const mergeData = new FormData();
        mergeData.append('filename', file.name);
        mergeData.append('total_chunks', totalChunks);
        mergeData.append('upload_id', uploadId);

        progressDiv.innerHTML = '병합 중...';

        const mergeRes = await fetch("/merge-chunks", {
            method: "POST",
            body: mergeData
        });
        const mergeJson = await mergeRes.json();

        if (mergeJson.filename) {
            progressDiv.innerHTML = `✅ 업로드 완료!`;
        } else {
            progressDiv.innerHTML = `❌ 병합 실패!`;
        }

        // 업로드/병합 후 새로고침
        setTimeout(() => location.reload(), 700);
    });
});

function deleteFile(encodedFilename) {
    fetch(`/delete/${encodedFilename}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(() => location.reload());
}

function copyLink(filename) {
    const encoded = encodeURIComponent(filename);
    const url = `${location.origin}/download/${encoded}`;
    navigator.clipboard.writeText(url)
        .then(() => alert("다운로드 링크가 복사되었습니다."));
}
