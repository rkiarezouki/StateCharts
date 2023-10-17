import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAMwBWIovWKAjADYAnMsW6A7EYAsugDQhMiALTmi5xX1OuATIqPLtp7QF8-KzQsPEIiABEAJQBBAHV2ADkAcWp6ZloANSZ+ISQQNDFJaVkFBE1lPkcXXQAOU00dbTdNGpqrGwQ3Pkr9TUMVLT4WzVMAoIwcAmIouMSUgCEAQwBjAGtYZBWwHNkCiSkZPNLTPkUiXW0+ZS7TIz5ag0V2xBbTIgq9K+U+4zrRwPyE1C0xi8WSFCY+HEYAATjs8nsiodQKUmm4iE0jC0al5WrUntZEPUiHU+G5dJ5tJpjNpFG5-ADgpMwjMwSkmLBlotkNtBLtRPtikdEN9KjVaporuV6TV6dpnghbJLVC0vOYjLpdC0NGNASEphFQXNUoxWBxuPCRIUDiUlJqiEYanpFOKfOTlArbG4HKrlFrlN4KSZlLqmcDDbNwbRTWxOLxNLkrYLkfI7Q6nRSmr07g1Pd70dojJ4dAGXRo3AEAfhUBA4Pz9YR+dahSi7JoC9pOzVnL4yW5vgSOrZ1No1MpTP2agPNQZQ0CDaRyE3k7aELo3gGA2SceO3Bq3AqfFU9+ufN5HV45w2QZGksukauVG8jN7XGTzA126YFZ5HBqGmYNSnBSFQhpWQA */
        id: "polyLine",
        initial: "idle",
        states : {
            idle: {on: {
                MOUSECLICK: {
                    target: "DRAWING",
                    actions: "createLine",
    
                },}},

            DRAWING: {
                on: {
                    MOUSEMOVE: {
                        target: "DRAWING",
                        actions: "setLastpoint",
                        internal: true
                    },

                    Backspace: {
                        target: "DRAWING",
                        cond: "plusDeDeuxPoints",
                        actions: "removeLastPoint",
                        internal: true
                    },

                    Enter: {
                        target: "idle",
                        actions: "saveLine"
                    },

                    Escape: {
                        target: "idle",
                        actions: "abandon"
                    },

                    MOUSECLICK: [{
                        target: "DRAWING",
                        cond: "pasPlein",
                        actions: "addPoint",
                        internal: true
                    }, {
                        target: "idle",
                        actions: "saveLine"
                    }]
                }
            }
        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
