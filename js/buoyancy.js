const b2Body = Box2D.Dynamics.b2Body;
const b2BuoyancyController = Box2D.Dynamics.Controllers.b2BuoyancyController;

export default class Buoyancy {
    constructor(world, creator, px, py, width, height) {
        this.world = world;
        this.creator = creator;
        this.poolBody = this.createPool(px, py - height, width, height);
        this.buoyancyController = new b2BuoyancyController();
        this.buoyancyController.offset = -py + height * 2 + 0.2;
        this.buoyancyController.useDensity = true;
        this.buoyancyController.density = 1.0;
        this.buoyancyController.linearDrag = 5;
        this.buoyancyController.angularDrag = 2;
        world.AddController(this.buoyancyController);

        let listener = new Box2D.Dynamics.b2ContactListener;
        const that = this;

        function getBodyFromContact(contact) {
            let bodyA = contact.GetFixtureA().GetBody();
            let bodyB = contact.GetFixtureB().GetBody();
            let body = bodyA === that.poolBody ? bodyB :
                bodyB === that.poolBody ? bodyA :
                undefined;
            return body;
        }
        listener.BeginContact = function (contact) {
            let body = getBodyFromContact(contact);
            if (body && !body.GetUserData().inFluid) {
                let data = body.GetUserData();
                data.inFluid = true;
                body.SetUserData(data);
                that.buoyancyController.AddBody(body);
            }
        }
        listener.EndContact = function (contact) {
            let body = getBodyFromContact(contact);
            if (body && body.GetUserData().inFluid) {
                let data = body.GetUserData();
                data.inFluid = false;
                body.SetUserData(data);
                that.buoyancyController.RemoveBody(body);
            }
        }
        this.world.SetContactListener(listener);
    }
    setDensity(density) {
        this.buoyancyController.density = density;
    }
    createPool(px, py, width, height) {
        let w = 0.2;
        let outer = w * 4;

        // pool
        let poolBody = this.creator.createBody(this.creator.vec2(px, py - w * 2),
            'Box', this.creator.vec2(width, height), {
                type: b2Body.b2_staticBody,
                isSensor: true
            });

        // left wall
        this.creator.createBody(this.creator.vec2(px - width - w, py - outer - w * 2),
            'Box', this.creator.vec2(w, height + outer), {
                type: b2Body.b2_staticBody
            });
        // right wall
        this.creator.createBody(this.creator.vec2(px + width + w, py - outer - w * 2),
            'Box', this.creator.vec2(w, height + outer), {
                type: b2Body.b2_staticBody
            });
        // bottom
        this.creator.createBody(this.creator.vec2(px, py + height - w),
            'Box', this.creator.vec2(width + w * 2, w), {
                type: b2Body.b2_staticBody
            });

        return poolBody;
    }
}