async function processVideo(videoFile) {
    const video = document.createElement('video');
    //video.src = URL.createObjectURL(videoFile);
    video.src='H:\R & D officer 2nd year\Programming hero responsive\Feroz Sir Task\video\dncc76c.mp4'
    video.crossOrigin = "anonymous";
    video.currentTime = 3; // Start from 3s
    
    await new Promise(resolve => video.onloadeddata = resolve);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fps = 30;
    let frameRate = 1 / fps;
    let frameData = [];

    async function extractFrames() {
        let sec = 0;
        for (let count = 100; count < 400; count++) {
            video.currentTime = sec;
            await new Promise(resolve => video.onseeked = resolve);
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let rSum = 0, gSum = 0, bSum = 0, pixelCount = imgData.data.length / 4;
            for (let i = 0; i < imgData.data.length; i += 4) {
                rSum += imgData.data[i];
                gSum += imgData.data[i + 1];
                bSum += imgData.data[i + 2];
            }
            frameData.push(rSum / pixelCount); // Using Red channel
            sec += frameRate;
        }
    }

    await extractFrames();

    function bandPassFilter(signal) {
        let BPM_L = 60, BPM_H = 220, order = 6;
        let nyquist = fps / 2;
        let low = BPM_L / 60 / nyquist;
        let high = BPM_H / 60 / nyquist;
        
        let filtered = signal.map((_, i, arr) => {
            if (i < order || i >= arr.length - order) return arr[i];
            let sum = 0;
            for (let j = -order; j <= order; j++) {
                let weight = Math.exp(-Math.pow(j / order, 2));
                sum += arr[i + j] * weight;
            }
            return sum / (order * 2 + 1);
        });
        return filtered;
    }

    let filteredSignal = bandPassFilter(frameData);
    plotSignal(filteredSignal);
}

function plotSignal(data) {
    let ctx = document.getElementById('chartCanvas').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: data.length }, (_, i) => i / 30),
            datasets: [{ label: 'Filtered Signal', data, borderColor: 'red', fill: false }]
        },
        options: { responsive: true, scales: { x: { title: { display: true, text: 'Time (s)' } }, y: { title: { display: true, text: 'Amplitude' } } } }
    });
}
