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

    const logoArea = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 140,
        width: 200,
        height: 100
    };

    const welcomeArea = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        width: 300,
        height: 150
    };

    for (let i = 0; i < numCircles; i++) {
        let x, y;

        // Ensure circles do not spawn in the logo or welcome message areas
        do {
            x = Math.random() * window.innerWidth;
            y = Math.random() * window.innerHeight;
        } while (
            x > logoArea.x - logoArea.width / 2 &&
            x < logoArea.x + logoArea.width / 2 &&
            y > logoArea.y - logoArea.height / 2 &&
            y < logoArea.y + logoArea.height / 2
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

    const logo = Bodies.rectangle(window.innerWidth / 2, window.innerHeight / 2 - 140, 150, 50, {
        isStatic: true, // Make the logo static
        render: {
            sprite: {
                texture: "KnotesLogo.png",
                xScale: 0.5,
                yScale: 0.5
            }
        }
    });

    World.add(world, [...shapes, logo]);

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

    // Keep canvas responsive
    window.addEventListener("resize", () => {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;

        // Update boundaries
        Matter.Body.setPosition(boundaries[0], { x: window.innerWidth / 2, y: -10 });
        Matter.Body.setPosition(boundaries[1], { x: window.innerWidth / 2, y: window.innerHeight + 10 });
        Matter.Body.setPosition(boundaries[2], { x: -10, y: window.innerHeight / 2 });
        Matter.Body.setPosition(boundaries[3], { x: window.innerWidth + 10, y: window.innerHeight / 2 });
    });
});
