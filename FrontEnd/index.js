document.addEventListener("DOMContentLoaded", () => {
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint, Vector, Events } = Matter;

    // Create engine and world
    const engine = Engine.create();
    const world = engine.world;

    world.gravity.y = 0; // No gravity on the y-axis
    world.gravity.x = 0; // No gravity on the x-axis

    // Create renderer
    const render = Render.create({
        element: document.getElementById("interactive-container"),
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false, // Use solid shapes
            background: "transparent"
        }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Add boundaries (walls)
    const boundaries = [
        Bodies.rectangle(window.innerWidth / 2, -10, window.innerWidth, 20, { isStatic: true }), // Top
        Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 10, window.innerWidth, 20, { isStatic: true }), // Bottom
        Bodies.rectangle(-10, window.innerHeight / 2, 20, window.innerHeight, { isStatic: true }), // Left
        Bodies.rectangle(window.innerWidth + 10, window.innerHeight / 2, 20, window.innerHeight, { isStatic: true }) // Right
    ];
    World.add(world, boundaries);

    // Add evenly distributed circles
    const shapes = [];
    const circleRadius = 15; // Smaller size for circles
    const numCircles = 50; // Increase the number of circles

    const welcomeArea = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        width: 300,
        height: 150
    };

    for (let i = 0; i < numCircles; i++) {
        let x, y;

        // Ensure circles do not spawn in the welcome message area
        do {
            x = Math.random() * window.innerWidth;
            y = Math.random() * window.innerHeight;
        } while (
            x > welcomeArea.x - welcomeArea.width / 2 &&
            x < welcomeArea.x + welcomeArea.width / 2 &&
            y > welcomeArea.y - welcomeArea.height / 2 &&
            y < welcomeArea.y + welcomeArea.height / 2
        );

        const circle = Bodies.circle(x, y, circleRadius, {
            restitution: 0.9,
            render: { fillStyle: "#0D7377" }
        });

        // Add a slow initial velocity to the circles
        const velocity = Vector.create((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        Matter.Body.setVelocity(circle, velocity);

        shapes.push(circle);
    }

    World.add(world, shapes);

    // Cap the velocity of shapes
    const maxVelocity = 5; // Maximum allowed velocity
    Events.on(engine, "afterUpdate", () => {
        shapes.forEach((shape) => {
            const velocity = shape.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

            if (speed > maxVelocity) {
                const scale = maxVelocity / speed;
                Matter.Body.setVelocity(shape, {
                    x: velocity.x * scale,
                    y: velocity.y * scale
                });
            }
        });
    });

    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });
    World.add(world, mouseConstraint);

    // Create and style the logo
    const logoElement = document.createElement("img");
    logoElement.src = "KnotesLogo.png";
    logoElement.alt = "Knotes Logo";
    logoElement.style.position = "absolute";
    logoElement.style.top = "30%";
    logoElement.style.left = "50%";
    logoElement.style.transform = "translateX(-50%)";
    logoElement.style.zIndex = "10";
    logoElement.style.width = "150px"; // Initial width
    logoElement.style.height = "auto"; // Maintain aspect ratio
    document.body.appendChild(logoElement);

    // Keep canvas and logo responsive
    window.addEventListener("resize", () => {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;

        // Update boundaries
        Matter.Body.setPosition(boundaries[0], { x: window.innerWidth / 2, y: -10 });
        Matter.Body.setPosition(boundaries[1], { x: window.innerWidth / 2, y: window.innerHeight + 10 });
        Matter.Body.setPosition(boundaries[2], { x: -10, y: window.innerHeight / 2 });
        Matter.Body.setPosition(boundaries[3], { x: window.innerWidth + 10, y: window.innerHeight / 2 });

        // Dynamically adjust the logo size
        const logoWidth = Math.max(100, window.innerWidth * 0.1); // Adjust width proportionally
        logoElement.style.width = `${logoWidth}px`;
    });
});
