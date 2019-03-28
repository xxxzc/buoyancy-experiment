const b2BodyDef = Box2D.Dynamics.b2BodyDef,
    b2Body = Box2D.Dynamics.b2Body,
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
    b2Shape = Box2D.Collision.Shapes.b2Shape,
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
    b2MassData = Box2D.Collision.Shapes.b2MassData,
    b2EdgeShape = Box2D.Collision.Shapes.b2EdgeShape,
    b2Vec2 = Box2D.Common.Math.b2Vec2;

export default class Creator {
    constructor(world) {
        this.world = world;
        this.fixtureProps = {
            density: 1.0,
            friction: 0.6,
            restitution: 0.2
        }
    }
    computeMass(shape) {
        let md = new b2MassData();
        shape.ComputeMass(md, 1);
        return md.mass;
    }
    Box(vec) {
        let shape = new b2PolygonShape();
        shape.SetAsBox(vec.x, vec.y);
        return shape;
    }
    OrientedBox(data) {
        let shape = new b2PolygonShape();
        shape.SetAsOrientedBox(data.data.x, data.data.y, data.center, 0);
        return shape;
    }
    Polygon(points) {
        let shape = new b2PolygonShape();
        shape.SetAsArray(points);
        let mass = this.computeMass(shape);
        if (mass < 0) {
            points.reverse();
        }
        shape.SetAsArray(points, points.length);
        return shape;
    }
    Circle(radius) {
        return new b2CircleShape(radius);
    }
    vec2(x, y) {
        return new b2Vec2(x, y);
    }
    getFixture(body) {
        for (let fixture = body.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
            return fixture;
        }
    }
    createBody(position, shape_type, shape_data, kargs = {}) {
        let bodyDef = new b2BodyDef();
        bodyDef.type = kargs.type === undefined ?
            b2Body.b2_dynamicBody : kargs.type;
        bodyDef.position = position;

        let body = this.world.CreateBody(bodyDef);

        let fixtureDef = Object.assign(new b2FixtureDef(), this.fixtureProps, kargs);
        fixtureDef.shape = this[shape_type](shape_data);

        let fixture = body.CreateFixture(fixtureDef);
        let data = {
            type: shape_type
        };
        body.SetUserData(data);

        return body;
    }
}