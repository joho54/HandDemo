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
    return true;
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
    // 기역: 엄지, 검지, 중지만 펴짐
    return (
        landmarks[8].y > landmarks[6].y &&
        landmarks[4].x > landmarks[3].x 
    )
}
function isNeun(landmarks) {
    return (
        landmarks[8].x > landmarks[6].x &&
        landmarks[4].y < landmarks[2].y 
    )
}

function isDegeud(landmarks) {
    return (
        landmarks[12].x > landmarks[10].x &&
        landmarks[8].x > landmarks[6].x
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
    maxNumHands: 2,
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
        // const fingerStates = getAllFingersState(landmarks);
        // let fingerStateText = '';
        // for (const finger of FINGERS) {
        //     fingerStateText += `${finger}: ${fingerStates[finger] ? '펴짐' : '접힘'}  `;
        // }
        // 기존 제스처 인식 흐름 유지
        if (isGiyeok(landmarks)) {
            resultDiv.textContent = '🖐️ 기역!';
        }
        // else if (isOnlyThumbExtended(landmarks)) {
        //     resultDiv.textContent = '👍 Thumbs Up!';
        // }
         else if (isAllFingersExtended(landmarks)) {
            resultDiv.textContent = '🖐️ Open Hand!';
        } else if (isVictory(landmarks)) {
            resultDiv.textContent = '✌️ Victory!';
        } else if (isGiyeok(landmarks)) {
            resultDiv.textContent = '🖐️ 기역!';
        } 
        else if (isNeun(landmarks)) {
            resultDiv.textContent = '🖐️ 니은!';
        }
        else if (isDegeud(landmarks)) {
            resultDiv.textContent = '🖐️ 디귿!';
        }
        else {
            resultDiv.textContent = 'Hand detected';
        }
        // resultDiv.textContent += 'checked';
        console.log('hand detected');
    } else {
        resultDiv.textContent = 'No hand detected';
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
