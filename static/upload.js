document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");

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
        const formData = new FormData();
        formData.append("file", file);

        await fetch("/upload", {
            method: "POST",
            body: formData
        });

        location.reload();
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
