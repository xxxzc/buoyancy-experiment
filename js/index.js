import Creator from './creator.js';
import DrawEvent from './event.js';
import Buoyancy from './buoyancy.js';

const b2World = Box2D.Dynamics.b2World,
    b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2Body = Box2D.Dynamics.b2Body,
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

const scale = 30;
let canvas, ctx, world, buoyancy, drawEvent, debugDraw, creator;
let canvasWidth, canvasHeight;

function to_float(str) {
    let f = Math.max(Math.min(parseFloat(str), 5), 0.1);
    return f;
}

var app = new Vue({
    el: '#app',
    data: {
        gravity_x: 0.0,
        gravity_y: 9.8,
        liquid_density: 1.0,
        liquid_densitys: {
            c: 0.0,
            w4: 1.0,
            g: 0.72,
            h: 1.50,
            b0: 3.12,
            m: 13.6
        },
        liquid_type: 'w4',
        liquids: [{
                name: '自定义',
                value: 'c'
            },
            {
                name: '水 4℃',
                value: 'w4'
            },
            {
                name: '汽油',
                value: 'g'
            },
            {
                name: '蜂蜜',
                value: 'h'
            },
            {
                name: '溴 0℃',
                value: 'b0'
            },
            {
                name: '水银',
                value: 'm'
            }
        ],
        object_density: 1.0,
        object_type: 'Circle',
        object_radius: 0.0,
        object_height: 0.0,
        object_width: 0.0,
        object_area: 0.0,
        object_types: [{
                label: '圆形',
                type: 'Circle'
            },
            {
                label: '矩形',
                type: 'Box'
            },
            {
                label: '多边形',
                type: 'Polygon'
            }
        ],
        selected_type: 'Box',
        selected_density: 0.0,
        selected_area: 0.0,
        selected_area_in_liquid: 0.0,
        selected_buoyancy: 0.0,
        selected_radius: 0.0,
        selected_height: 0.0,
        selected_width: 0.0
    },
    watch: {
        gravity_x: function (cur) {
            if (cur)
                world.SetGravity(creator.vec2(to_float(cur), to_float(this.gravity_y)));
        },
        gravity_y: function (cur) {
            if (cur)
                world.SetGravity(creator.vec2(to_float(this.gravity_x), to_float(cur)));
        },
        liquid_type: function (cur, old) {
            if (cur !== 'c')
                this.liquid_density = this.liquid_densitys[cur];
        },
        liquid_density: function (cur) {
            if (cur)
                buoyancy.setDensity(cur);
            if (cur !== this.liquid_densitys[this.liquid_type])
                this.liquid_type = 'c';
        },
        selected_density: function (cur) {
            if (cur) {
                let fixture = creator.getFixture(drawEvent.selectedBody);
                drawEvent.selectedBody.ResetMassData();
                fixture.SetDensity(to_float(cur));
            }
        },
        selected_height: function (cur) {
            if (cur) {
                let fixture = creator.getFixture(drawEvent.selectedBody);
                fixture.GetShape().SetAsBox(to_float(this.selected_width / 2), to_float(this.selected_height / 2));
            }
        },
        selected_width: function (cur) {
            if (cur) {
                let fixture = creator.getFixture(drawEvent.selectedBody);
                fixture.GetShape().SetAsBox(to_float(this.selected_width / 2), to_float(this.selected_height / 2));
            }
        },
        selected_radius: function (cur) {
            if (cur) {
                let fixture = creator.getFixture(drawEvent.selectedBody);
                fixture.GetShape().SetRadius(to_float(cur));
            }
        }
    }
})

window.onload = function () {
    canvas = document.getElementById('playground');

    // resize canvas
    window.addEventListener("resize", resizeCanvas);

    function resizeCanvas() {
        canvas.width = Math.min(Math.round(window.innerWidth / scale) * scale, 1400);
        canvas.height = Math.max(Math.round(window.innerHeight / scale) * scale * 0.7, 600);
        canvasWidth = canvas.width / scale;
        canvasHeight = canvas.height / scale;
    }
    resizeCanvas();

    // world
    world = new b2World(new b2Vec2(app.gravity_x, app.gravity_y), true);

    // creator for create body
    creator = new Creator(world);

    // setup debug draw
    debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(canvas.getContext("2d"));
    debugDraw.SetDrawScale(scale);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit |
        b2DebugDraw.e_jointBit
        // | b2DebugDraw.e_aabbBit
    );
    world.SetDebugDraw(debugDraw);

    // handle mouse and touch event
    drawEvent = new DrawEvent(world, canvas, debugDraw, creator, app, scale);

    // ground
    let ground = 10 / scale;
    creator.createBody(creator.vec2(canvasWidth / 2, canvasHeight - ground),
        'Box', creator.vec2(canvas.width, ground), {
            type: b2Body.b2_staticBody
        });

    // pool
    buoyancy = new Buoyancy(world, creator,
        canvasWidth / 13 * 10, canvasHeight - ground * 2,
        canvasWidth / 6, canvasHeight / 5);
    buoyancy.setDensity(app.liquid_density);

    // creator.createBody(3, 0,
    //     Shape.box(2, 2), {
    //         density: 0.5
    //     });
    let test = creator.createBody(creator.vec2(canvasWidth / 7 * 5, 10),
        'Box', creator.vec2(1, 1), {
            density: 0.5
        });

    window.setInterval(function update() {

        world.Step(
            1 / 60, 8, 4
        );

        // update selected object
        let body = drawEvent.selectedBody;
        if (body) {
            let fixture = creator.getFixture(body);
            let data = body.GetUserData();
            app.selected_density = fixture.GetDensity();
            app.selected_area = creator.computeMass(fixture.GetShape());
            app.selected_area_in_liquid = data.area_in_liquid || 0.0;
            app.selected_buoyancy = Math.abs(data.buoyancy && data.buoyancy.y) || 0.0;
            if (app.selected_buoyancy < 0.02)
                app.selected_buoyancy = 0.0;
        } else {
            app.selected_type = null;
        }

        world.DrawDebugData();

        if (drawEvent.moveType > -1 && !drawEvent.mouseJoint) {
            drawEvent['draw' + app.object_type]();
        }
        world.ClearForces();
    }, 1000 / 60);
};