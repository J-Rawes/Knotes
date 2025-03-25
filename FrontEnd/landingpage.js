document.addEventListener("DOMContentLoaded", function () {
    fadeInWelcomeBox();
    startDoodleAnimation();
});

function fadeInWelcomeBox() {
    const welcomeBox = document.querySelector(".welcome-box");
    if (!welcomeBox) return;
    welcomeBox.style.opacity = 0;
    welcomeBox.style.transition = "opacity 2s ease-in-out";
    setTimeout(() => {
        welcomeBox.style.opacity = 1;
    }, 100);
}

function startDoodleAnimation() {
    // Create and set up the canvas
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "-1"; // Send behind other content
    canvas.style.backgroundColor = "#ffffff";
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        console.error("Canvas context is not available.");
        return;
    }

    // Function to draw random doodles
    function drawDoodle() {
        const colors = ["#e86a92", "#f7e733", "#41e2ba", "#494D6F", "#F9EE77"]; // Different colors for variation
        const shapes = ["circle", "square", "triangle", "star", "hexagon"];

        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 40 + 10; // Random size between 10 and 50
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const rotation = Math.random() * Math.PI * 2; // Random rotation angle

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();

        if (shape === "circle") {
            ctx.arc(0, 0, size, 0, Math.PI * 2);
        } else if (shape === "square") {
            ctx.rect(-size / 2, -size / 2, size, size);
        } else if (shape === "triangle") {
            ctx.moveTo(-size / 2, size / 2);
            ctx.lineTo(size / 2, size / 2);
            ctx.lineTo(0, -size / 2);
            ctx.closePath();
        } else if (shape === "star") {
            const spikes = 5;
            const outerRadius = size;
            const innerRadius = size / 2;
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(Math.cos((i * 2 * Math.PI) / spikes) * outerRadius, Math.sin((i * 2 * Math.PI) / spikes) * outerRadius);
                ctx.lineTo(Math.cos(((i + 0.5) * 2 * Math.PI) / spikes) * innerRadius, Math.sin(((i + 0.5) * 2 * Math.PI) / spikes) * innerRadius);
            }
            ctx.closePath();
        } else if (shape === "hexagon") {
            const sides = 6;
            for (let i = 0; i < sides; i++) {
                ctx.lineTo(Math.cos((i * 2 * Math.PI) / sides) * size, Math.sin((i * 2 * Math.PI) / sides) * size);
            }
            ctx.closePath();
        }

        ctx.stroke();
        ctx.restore();
    }

    // Draw a doodle every second
    function animate() {
        drawDoodle();
        setTimeout(animate, 1000);
    }

    animate(); // Start animation loop

    // Resize canvas if the window resizes
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}