const b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Shape = Box2D.Collision.Shapes.b2Shape,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2Vec2 = Box2D.Common.Math.b2Vec2,
    b2Math = Box2D.Common.Math.b2Math,
    b2AABB = Box2D.Collision.b2AABB,
    b2Color = Box2D.Common.b2Color;

export default class Box2dHelper {
    static fixtureProps = {
        density: 1.0,
        friction: 0.6,
        restitution: 0.2
    }
    static computeMass(shape) {
        let md = new b2MassData();
        shape.ComputeMass(md, 1);
        return md.mass;
    }
    static Box(size) {
        let shape = new b2PolygonShape();
        shape.SetAsBox(size.x, size.y);
        return shape;
    }
    static OrientedBox(data) {
        let shape = new b2PolygonShape();
        shape.SetAsOrientedBox(data.data.x, data.data.y, data.center, 0);
        return shape;
    }
    static Polygon(points) {
        let shape = new b2PolygonShape();
        shape.SetAsArray(points);
        let mass = Box2dHelper.computeMass(shape);
        if (mass < 0) {
            points.reverse();
        }
        shape.SetAsArray(points, points.length);
        return shape;
    }
    static Circle(radius) {
        return new b2CircleShape(radius);
    }
    static Vec2(x, y) {
        return new b2Vec2(x, y);
    }
    static getFixture(body) {
        for (let fixture = body.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
            return fixture;
        }
        return null;
    }
    static createBox(world, px, py, width, height, type, isSensor=false) {
        return Box2dHelper.createBody(world, Box2dHelper.Vec2(px, py), 'Box', Box2dHelper.Vec2(width, height), {
            type: type, isSensor: isSensor
        });
    }
    static createBody(world, position, shape_type, shape_data, kargs = {}) {
        let bodyDef = new b2BodyDef();
        bodyDef.type = kargs.type === undefined ?
            b2Body.b2_dynamicBody : kargs.type;
        bodyDef.position = position;

        let body = world.CreateBody(bodyDef);

        let fixtureDef = Object.assign(new b2FixtureDef(), Box2dHelper.fixtureProps, kargs);
        fixtureDef.shape = Box2dHelper[shape_type](shape_data);

        body.CreateFixture(fixtureDef);
        let data = {
            shape: shape_type
        };
        body.SetUserData(data);

        return body;
    }
    static getBodyAtPosition(world, position) {
        let moveX = position.x;
        let moveY = position.y;
        let point = new b2Vec2(moveX, moveY);
        let aabb = new b2AABB();
        aabb.lowerBound.Set(moveX - 0.001, moveY - 0.001);
        aabb.upperBound.Set(moveX + 0.001, moveY + 0.001);

        let selectedBody = null;
        world.QueryAABB(fixture => {
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
}