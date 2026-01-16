/**
 * Minecraft Daltonizer Suite - Color Logic
 * Implements LMS Daltonization Algorithm
 */

// Gamma correction value
const GAMMA = 2.2;

// RGB to LMS Matrix
const RGB_TO_LMS = [
    17.8824, 43.5161, 4.11935,
    3.45565, 27.1554, 3.86714,
    0.0299566, 0.184309, 1.46709
];

// LMS to RGB Matrix (Inverse of RGB_TO_LMS approx)
const LMS_TO_RGB = [
    0.0809444479, -0.130504409, 0.116721066,
    -0.0102485335, 0.0540193266, -0.113614708,
    -0.000365296938, -0.00412161469, 0.693511405
];

// Simulation Matrices (Source: http://vision.psychol.cam.ac.uk/jdmollon/papers/colourmaps.pdf or standard approx)
// These define what information is lost for each condition.
// Applying these to an LMS color simulates the blindness.

const SIMULATION_MATRICES = {
    protanopia: [
        0, 2.02344, -2.52581,
        0, 1, 0,
        0, 0, 1
    ],
    deuteranopia: [
        1, 0, 0,
        0.494207, 0, 1.24827,
        0, 0, 1
    ],
    tritanopia: [
        1, 0, 0,
        0, 1, 0,
        -0.395913, 0.801109, 0
    ],
    achromatopsia: [
        // Monochromacy is usually done in RGB space usually (luminance), but can be approximated here.
        // For simplicity/accuracy, we often use Luminance in RGB.
        // However, keeping consistent pipeline:
        0, 0, 0, // Simplified placeholder, will implement custom logic for mono
        0, 0, 0,
        0, 0, 0
    ]
};

// Error Shift Matrices (Daltonization)
// How to distribute the "error" (difference) into visible channels.
const ERR_SHIFT_MATRICES = {
    protanopia: [
        0, 0, 0,
        0.7, 1, 0,
        0.7, 0, 1
    ],
    deuteranopia: [
        1, 0.7, 0,
        0, 0, 0,
        0, 0.7, 1
    ],
    tritanopia: [
        1, 0, 0.7,
        0, 1, 0.7,
        0, 0, 0
    ]
};


/**
 * Apply a 3x3 matrix to a 3-element vector
 */
function multiplyVector(matrix, vector) {
    const [a, b, c, d, e, f, g, h, i] = matrix;
    const [x, y, z] = vector;
    return [
        a * x + b * y + c * z,
        d * x + e * y + f * z,
        g * x + h * y + i * z
    ];
}

/**
 * Gamma correction: 0-255 -> 0-1 Linear
 */
function toLinear(v) {
    return Math.pow(v / 255, GAMMA);
}

/**
 * Inverse Gamma: 0-1 Linear -> 0-255
 */
function fromLinear(v) {
    return Math.min(255, Math.max(0, Math.pow(v, 1 / GAMMA) * 255));
}

/**
 * Process a single pixel [r, g, b]
 * @param {Array} color - [r, g, b] 0-255
 * @param {String} type - 'protanopia', 'deuteranopia', 'tritanopia'
 * @param {Boolean} simulateOnly - If true, returns simulated view. If false, returns corrected.
 */
export function processPixel(color, type, simulateOnly = false) {
    if (type === 'normal') return color;

    const [r, g, b] = color;

    // 1. RGB to Linear RGB
    const linRGB = [toLinear(r), toLinear(g), toLinear(b)];

    // 2. Linear RGB to LMS
    const lms = multiplyVector(RGB_TO_LMS, linRGB);

    // 3. Simulate Blindness in LMS
    // Handle Achromatopsia separately (Luminance) or if matrix is full zero
    let simulatedLms;
    if (type === 'achromatopsia') {
        // Standard NTSC Grayscale: 0.299R + 0.587G + 0.114B
        // We do this in linear RGB for physics correctness, or sRGB for perceptual. 
        // Let's do sRGB standard for simplicity or stick to LMS pipeline if we had a matrix.
        // For now, let's use the RGB luminance shortcut and skip LMS return for this specific case if needed,
        // BUT strictly, we should try to daltonize it. Daltonizing for monochromacy is contrast enhancement.
        // Let's implement standard grayscale for simulation.
        const gray = 0.299 * linRGB[0] + 0.587 * linRGB[1] + 0.114 * linRGB[2];
        simulatedLms = multiplyVector(RGB_TO_LMS, [gray, gray, gray]); // Pseudo-LMS of gray
    } else {
        simulatedLms = multiplyVector(SIMULATION_MATRICES[type], lms);
    }

    // 4. Back to RGB (Simulated)
    const linSimulatedRGB = multiplyVector(LMS_TO_RGB, simulatedLms);

    if (simulateOnly) {
        return [
            fromLinear(linSimulatedRGB[0]),
            fromLinear(linSimulatedRGB[1]),
            fromLinear(linSimulatedRGB[2])
        ];
    }

    // 5. Calculate Error (Original - Simulated)
    const error = [
        linRGB[0] - linSimulatedRGB[0],
        linRGB[1] - linSimulatedRGB[1],
        linRGB[2] - linSimulatedRGB[2]
    ];

    // 6. Shift Error (Daltonization)
    // For achromatopsia, standard daltonization isn't defined same way. We usually ignore it or do contrast stretch.
    // We will skip correction for achromatopsia for now or just return simulated.
    if (type === 'achromatopsia') {
        return [
            fromLinear(linSimulatedRGB[0]),
            fromLinear(linSimulatedRGB[1]),
            fromLinear(linSimulatedRGB[2])
        ];
    }

    const shift = multiplyVector(ERR_SHIFT_MATRICES[type], error);

    // 7. Add Compensation to Original
    const correctedLinRGB = [
        linRGB[0] + shift[0],
        linRGB[1] + shift[1],
        linRGB[2] + shift[2]
    ];

    return [
        fromLinear(correctedLinRGB[0]),
        fromLinear(correctedLinRGB[1]),
        fromLinear(correctedLinRGB[2])
    ];
}
