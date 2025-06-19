// import { Hands } from '@mediapipe/hands';
// import { Camera } from '@mediapipe/camera_utils';
const { Hands } = window;
const { Camera } = window;

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');
const resultDiv = document.getElementById('result');

// 손가락별 tip, pip 인덱스 정의
const FINGER_TIPS = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const FINGER_PIPS = { thumb: 3, index: 6, middle: 10, ring: 14, pinky: 18 };
const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'];

function isFingerExtended(landmarks, finger) {
    return landmarks[FINGER_TIPS[finger]].y < landmarks[FINGER_PIPS[finger]].y;
}

function isOnlyThumbExtended(landmarks) {
    return isFingerExtended(landmarks, 'thumb') &&
        !isFingerExtended(landmarks, 'index') &&
        !isFingerExtended(landmarks, 'middle') &&
        !isFingerExtended(landmarks, 'ring') &&
        !isFingerExtended(landmarks, 'pinky');
}

function isAllFingersExtended(landmarks) {
    return FINGERS.every(f => isFingerExtended(landmarks, f));
}

function isVictory(landmarks) {
    // V: index, middle만 펴짐
    return !isFingerExtended(landmarks, 'thumb') &&
        isFingerExtended(landmarks, 'index') &&
        isFingerExtended(landmarks, 'middle') &&
        !isFingerExtended(landmarks, 'ring') &&
        !isFingerExtended(landmarks, 'pinky');
}

function isGiyeok(landmarks) {
    // 기역: 엄지, 검지, 중지가 펴짐
    return (
        landmarks[8].x < landmarks[6]. // index tip above pip
        // && landmarks[4].x < landmarks[2].x // middle tip above pip
    )
}

// 각 손가락별 펴짐/접힘 상태를 모두 표시
function getAllFingersState(landmarks) {
    return FINGERS.reduce((acc, finger) => {
        acc[finger] = isFingerExtended(landmarks, finger);
        return acc;
    }, {});
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        // 랜드마크 시각화: 각 점과 인덱스 번호 표시
        landmarks.forEach((landmark, i) => {
            canvasCtx.beginPath();
            canvasCtx.arc(landmark.x * canvasElement.width, landmark.y * canvasElement.height, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = 'red';
            canvasCtx.fill();
            canvasCtx.font = '12px Arial';
            canvasCtx.fillStyle = 'yellow';
            canvasCtx.fillText(i, landmark.x * canvasElement.width + 6, landmark.y * canvasElement.height - 6);
        });
        // 각 손가락별 펴짐/접힘 상태 표시
        const fingerStates = getAllFingersState(landmarks);
        let fingerStateText = '';
        for (const finger of FINGERS) {
            fingerStateText += `${finger}: ${fingerStates[finger] ? '펴짐' : '접힘'}  `;
        }
        resultDiv.innerHTML = fingerStateText + '<br>';
        // 기존 제스처 인식 흐름 유지
        if (isOnlyThumbExtended(landmarks)) {
            resultDiv.innerHTML += '👍 Thumbs Up!';
        } else if (isAllFingersExtended(landmarks)) {
            resultDiv.innerHTML += '🖐️ Open Hand!';
        } else if (isVictory(landmarks)) {
            resultDiv.innerHTML += '✌️ Victory!';
        } else if (isGiyeok(landmarks)) {
            resultDiv.innerHTML += '🖐️ 기역!';
        } else {
            resultDiv.innerHTML += 'Hand detected';
        }
    } else {
        resultDiv.textContent = 'No hand';
    }
    canvasCtx.restore();
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});
camera.start();
