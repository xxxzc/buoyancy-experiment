const b2Body = Box2D.Dynamics.b2Body;
const b2BuoyancyController = Box2D.Dynamics.Controllers.b2BuoyancyController;
import Box2dHelper from './box2dHelper.js';

export default class Buoyancy {
    constructor(world, px, py, width, height) {
        this.w = 0.2;
        let w = this.w;
        let outer = w * 4;
        // pool
        this.poolBody = Box2dHelper.createBox(world, px, py-height-w*2, 
            width, height, b2Body.b2_staticBody, true);
        // left wall
        Box2dHelper.createBox(world, px-width-w, py-height-outer-w*2, 
            w, height+outer, b2Body.b2_staticBody);
        // right wall
        Box2dHelper.createBox(world, px+width+w, py-height-outer-w*2, 
            w, height+outer, b2Body.b2_staticBody);
        // bottom
        Box2dHelper.createBox(world, px, py-w, 
            width+w*2, w, b2Body.b2_staticBody);

        this.buoyancyController = new b2BuoyancyController();
        this.buoyancyController.offset = -py + height * 2 + this.w;
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
        world.SetContactListener(listener);
    }
    getController() {
        return this.buoyancyController;
    }
    setDensity(density) {
        this.buoyancyController.density = density;
    }
}