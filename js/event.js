const b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2Math = Box2D.Common.Math.b2Math,
    b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef,
    b2AABB = Box2D.Collision.b2AABB,
    b2Color = Box2D.Common.b2Color,
    b2Body = Box2D.Dynamics.b2Body;

const NONE = -1,
    MOUSE = 1,
    TOUCH = 2;

const color = new b2Color(0.9, 0.7, 0.7);

const passive = {
        passive: true
    },
    nonpassive = {
        passive: false
    };

export default class DrawEvent {
    constructor(world, canvas, debugDraw, creator, app, scale) {
        this.world = world;
        this.scale = scale;
        this.creator = creator;
        this.debugDraw = debugDraw;
        this.canvas = canvas;
        this.moveType = -1;
        this.app = app;
        this.drawPoints = [];
        this.mouseJoint = null;
        this.selectedBody = null;
        this.scale = scale;

        canvas.addEventListener('mousedown', e => this.handleMoveStart(e, MOUSE), passive);
        canvas.addEventListener('mouseup', e => this.handleMoveEnd(e), passive);

        canvas.addEventListener('touchstart', e => this.handleMoveStart(e, TOUCH), nonpassive);
        canvas.addEventListener('touchend', e => this.handleMoveEnd(e), nonpassive);

        const that = this;
        this.moveListener = function (e) {
            that.handleMove(e);
        }
    }
    keep2(value) {
        return Math.round(value * 100) / 100;
    }
    drawCircle() {
        // retern center and radius
        let center = this.drawPoints[0];
        let outer = this.drawPoints[this.drawPoints.length - 1];
        let radius = this.keep2(b2Math.Distance(center, outer));
        this.debugDraw.DrawCircle(center, radius, color);
        this.app.object_radius = radius;
        this.app.object_area = radius * radius * Math.PI
        return {
            center: center,
            data: radius
        };
    }
    drawPolygon() {
        const interval = this.moveType === TOUCH ? 10 : 20;
        // return points to draw
        let points = [];
        for (let i = 0; i < this.drawPoints.length; i += interval)
            points.push(this.drawPoints[i]);
        if (points.length < 3) return null;
        let shape = this.creator.Polygon(points);
        this.app.object_area = this.creator.computeMass(shape);
        this.debugDraw.DrawPolygon(shape.GetVertices(), shape.GetVertexCount(), color);
        return {
            center: this.creator.vec2(0, 0),
            data: points
        };
    }
    drawBox() {
        // return center, width and height
        let center = this.drawPoints[0];
        let outer = this.drawPoints[this.drawPoints.length - 1];
        let width = this.keep2(Math.abs(outer.x - center.x));
        let height = this.keep2(Math.abs(outer.y - center.y));
        this.app.object_width = width * 2;
        this.app.object_height = height * 2;
        this.app.object_area = width * height * 4;
        let data = {
            center: center,
            data: this.creator.vec2(width, height)
        }
        let shape = this.creator.OrientedBox(data);
        this.debugDraw.DrawPolygon(shape.GetVertices(), shape.GetVertexCount(), color);
        return data;
    }
    handleMoveStart(e, type) {
        this.moveType = type;
        this.drawPoints = [];
        this.handleMove(e);

        if (this.moveType === MOUSE) {
            this.canvas.addEventListener('mousemove', this.moveListener, passive);
        } else if (this.moveType === TOUCH) {
            this.canvas.addEventListener('touchmove',
                this.moveListener, nonpassive);
            e.preventDefault();
        }

    }
    handleMove(e) {
        if (this.moveType === NONE)
            return;
        let moveX, moveY;
        if (this.moveType === MOUSE) {
            if (e.offsetX) {
                moveX = e.offsetX;
                moveY = e.offsetY;
            } else if (e.layerX) {
                moveX = e.layerX;
                moveY = e.layerY;
            }
        } else if (this.moveType === TOUCH) {
            if (e.touches.length == 1) {
                let touch = e.touches[0];
                moveX = touch.pageX - touch.target.offsetLeft;
                moveY = touch.pageY - touch.target.offsetTop;
            }
        }

        if (moveX >= this.canvas.width - 5 ||
            moveY >= this.canvas.height - 5) {
            this.handleMoveEnd(e);
            return;
        }

        moveX = moveX / this.scale;
        moveY = moveY / this.scale;
        if (!moveX) return;

        if (!this.mouseJoint) {
            // get body at this point
            let body = this.getBodyAtMouse(moveX, moveY);
            if (body) {
                // find body, stop drawing
                this.selectedBody = body;
                this.updateSelected();
                this.drawPoints = [];
                let md = new b2MouseJointDef();
                md.bodyA = this.world.GetGroundBody();
                md.bodyB = body;
                md.target.Set(moveX, moveY);
                md.collideConnected = true;
                md.maxForce = 300.0 * body.GetMass();
                this.mouseJoint = this.world.CreateJoint(md);
                body.SetAwake(true);
            }
        }

        if (!this.mouseJoint) {
            this.selectedBody = null;
            this.pushPoint(moveX, moveY);
        }

        if (this.mouseJoint) {
            this.mouseJoint.SetTarget(new b2Vec2(moveX, moveY));
        }

        if (this.moveType === TOUCH)
            e.preventDefault();
    }
    updateSelected() {
        let body = this.selectedBody;
        this.app.selected_type = body.GetUserData().type;
        let fixture = this.creator.getFixture(body);
        if (this.app.selected_type === 'Circle')
            this.app.selected_radius = fixture.GetShape().GetRadius();
        if (this.app.selected_type === 'Box') {
            let points = fixture.GetShape().GetVertices();
            this.app.selected_width = points[1].x - points[0].x;
            this.app.selected_height = points[2].y - points[1].y;
        }
    }
    handleMoveEnd(e) {
        if (this.mouseJoint) {
            this.world.DestroyJoint(this.mouseJoint);
            this.mouseJoint = null;
        } else {
            if (this.drawPoints.length > 2) {
                let type = this.app.object_type;
                let data = this['draw' + type]();
                if (this.app.object_area > 0.2) {
                    this.selectedBody = this.creator.createBody(data.center, type, data.data, {
                        density: this.app.object_density
                    });
                    this.updateSelected();
                }
                this.app.object_radius = 0;
                this.app.object_height = 0;
                this.app.object_width = 0;
                this.app.object_area = 0;
            }
        }
        if (this.moveType === MOUSE) {
            this.canvas.removeEventListener('mousemove',
                this.moveListener, passive);
        }
        if (this.moveType === TOUCH)
            this.canvas.removeEventListener('touchmove',
                this.moveListener, nonpassive);
        this.moveType = NONE;
    }
    getBodyAtMouse(moveX, moveY) {
        let point = new b2Vec2(moveX, moveY);
        let aabb = new b2AABB();
        aabb.lowerBound.Set(moveX - 0.001, moveY - 0.001);
        aabb.upperBound.Set(moveX + 0.001, moveY + 0.001);

        let selectedBody = null;
        this.world.QueryAABB(fixture => {
            if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
                if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), point)) {
                    selectedBody = fixture.GetBody();
                    return false;
                }
            }
            return true;
        }, aabb);
        return selectedBody;
    }
    pushPoint(px, py) {
        this.drawPoints.push({
            x: px,
            y: py
        })
    }
}