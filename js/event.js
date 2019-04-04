const b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2Math = Box2D.Common.Math.b2Math,
    b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef,
    b2AABB = Box2D.Collision.b2AABB,
    b2Color = Box2D.Common.b2Color,
    b2Body = Box2D.Dynamics.b2Body;

const NONE = -1,
    END = 0,
    MOUSE = 1,
    TOUCH = 2;

const color = new b2Color(0.9, 0.7, 0.7);

const passive = {
        passive: true
    },
    nonpassive = {
        passive: false
    };

import Box2dHelper from './box2dHelper.js';

export default class DrawEvent {
    constructor(canvas, debugDraw, scale=1) {
        this.scale = scale;
        this.debugDraw = debugDraw;
        this.canvas = canvas;
        this.resetMoveState();

        canvas.addEventListener('mousedown', e => this.handleMoveStart(e, MOUSE), passive);
        canvas.addEventListener('mouseup', e => this.handleMoveEnd(e), passive);

        canvas.addEventListener('touchstart', e => this.handleMoveStart(e, TOUCH), nonpassive);
        canvas.addEventListener('touchend', e => this.handleMoveEnd(e), nonpassive);

        // only one move listener
        const that = this;
        this.moveListener = function (e) {
            that.handleMove(e);
        }
    }
    resetMoveState() {
        this.moveState = NONE;
        this.movePoints = [];
    }
    pushPoint(px, py) {
        this.movePoints.push({
            x: px / this.scale,
            y: py / this.scale
        })
    }
    getMovePosition() {
        let length = this.movePoints.length;
        if (length > 0)
            return this.movePoints[length - 1];
        else return { x: 0, y: 0 };
    }
    getMovePoints() {
        return this.movePoints;
    }
    getMoveState() {
        return this.moveState;
    }
    isMoveEnd() {
        return this.moveState === END;
    }
    round(value) {
        return Math.round(value * 100) / 100;
    }
    drawCircle() {
        // retern center and radius
        let center = this.movePoints[0];
        let outer = this.movePoints[this.movePoints.length - 1];
        let radius = this.round(b2Math.Distance(center, outer));
        this.debugDraw.DrawCircle(center, radius, color);
        return {
            center: center,
            data: radius
        };
    }
    drawPolygon() {
        const interval = this.moveState === TOUCH ? 10 : 20;
        // return points to draw
        let points = [];
        for (let i = 0; i < this.movePoints.length; i += interval)
            points.push(this.movePoints[i]);
        if (points.length < 3) return null;
        let shape = Box2dHelper.Polygon(points);
        this.debugDraw.DrawPolygon(shape.GetVertices(), shape.GetVertexCount(), color);
        return {
            center: Box2dHelper.Vec2(0, 0),
            data: points
        };
    }
    drawBox() {
        // return center, width and height
        let center = this.movePoints[0];
        let outer = this.movePoints[this.movePoints.length - 1];
        let width = this.round(Math.abs(outer.x - center.x));
        let height = this.round(Math.abs(outer.y - center.y));
        let data = {
            center: center,
            data: Box2dHelper.Vec2(width, height)
        }
        let shape = Box2dHelper.OrientedBox(data);
        this.debugDraw.DrawPolygon(shape.GetVertices(), shape.GetVertexCount(), color);
        return data;
    }
    handleMoveStart(e, state) {
        this.resetMoveState();
        this.moveState = state;
        this.handleMove(e);

        if (this.moveState === MOUSE) {
            this.canvas.addEventListener('mousemove', this.moveListener, passive);
        } else if (this.moveState === TOUCH) {
            this.canvas.addEventListener('touchmove',
                this.moveListener, nonpassive);
            e.preventDefault();
        }

    }
    handleMove(e) {
        if (this.moveState === NONE)
            return;
        let moveX, moveY;
        if (this.moveState === MOUSE) {
            if (e.offsetX) {
                moveX = e.offsetX, moveY = e.offsetY;
            } else if (e.layerX) {
                moveX = e.layerX, moveY = e.layerY;
            }
        } else if (this.moveState === TOUCH) {
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
        if (!moveX) return;

        this.pushPoint(moveX, moveY);

        if (this.moveState === TOUCH)
            e.preventDefault();
    }
    handleMoveEnd(e) {
        if (this.moveState === MOUSE) {
            this.canvas.removeEventListener('mousemove',
                this.moveListener, passive);
        }
        if (this.moveState === TOUCH)
            this.canvas.removeEventListener('touchmove',
                this.moveListener, nonpassive);
        this.moveState = END;
    }
}