import {createHandler} from '../../server/app.mjs';
import {createAdminHandler} from '../../server/admin.mjs';
import {images} from '../../server/images.mjs';
export default createHandler({adminHandler:createAdminHandler({images})});
