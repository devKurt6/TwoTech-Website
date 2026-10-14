import {createHandler} from '../../server/app.mjs';
import {createAdminHandler} from '../../server/admin.mjs';
export default createHandler({adminHandler:createAdminHandler()});
