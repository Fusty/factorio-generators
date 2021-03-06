const Blueprint = require('factorio-blueprint');

module.exports = function(string, opt) {
  
  opt = opt || {};

  const FLIP_X = opt.flipX || false;
  const FLIP_Y = opt.flipY || false;
  const ENTITY_REPLACE = opt.entityReplace || [];
  const RECIPE_REPLACE = opt.recipeReplace || [];
  const MODULE_REPLACE = opt.moduleReplace || [];
  const MODIFIED_ONLY = opt.modifiedOnly || false;

  const newEntityData = {};

  const old = new Blueprint(string, { checkWithEntityData: false });
  const bp = new Blueprint(null, { checkWithEntityData: false });

  [ENTITY_REPLACE, RECIPE_REPLACE, MODULE_REPLACE].forEach(replaceType => {
    replaceType.forEach(replace => {
      ['to', 'from', 'includes'].forEach(type => {
        if (replace[type] && !Blueprint.getEntityData()[bp.jsName(replace[type].replace('includes:', ''))]) newEntityData[bp.jsName(replace[type].replace('includes:', ''))] = { type: 'item' };
      });
    });
  });

  Blueprint.setEntityData(newEntityData);

  old.entities.forEach(ent => {

    ENTITY_REPLACE.forEach(replace => {
      if (ent.name == bp.jsName(replace.from) || ent.name.includes(bp.jsName(replace.includes))) {
        ent.name = bp.jsName(replace.to);
        ent.changed = true;
      }
    });
  });

  old.tiles.forEach(tile => {
    ENTITY_REPLACE.forEach(replace => {
      if (tile.name == bp.jsName(replace.from) || tile.name.includes(bp.jsName(replace.includes))) {
        tile.name = bp.jsName(replace.to);
        tile.changed = true;
      }
    });
  });

  old.entities.forEach(ent => {
    RECIPE_REPLACE.forEach(replace => {
      if (ent.recipe == bp.jsName(replace.from) || ent.recipe.includes(bp.jsName(replace.includes))) {
        ent.recipe = bp.jsName(replace.to);
        ent.changed = true;
      }
    });
  });

  old.entities.forEach(ent => {
    if (!ent.modules) return;
    MODULE_REPLACE.forEach(replaceModule => {
      ent.modules.forEach(mod => {
        if (mod.item == bp.jsName(replaceModule.from) || mod.item.includes(bp.jsName(replaceModule.includes))) {
          mod.item = bp.jsName(replaceModule.to);
          ent.changed = true;
        }
      });
    });
  });

  old.entities.forEach(ent => {
    if (!Blueprint.getEntityData()[ent.name]) {
      const obj = {};
      obj[ent.name] = { type: 'item' };
      Blueprint.setEntityData(obj);
    }
    if (ent.changed || !MODIFIED_ONLY) bp.createEntityWithData(ent.getData(), true, true, true); // Allow overlap in case modded items with unknown size
  });

  bp.entities.forEach(ent => {
    ent.place(bp.entityPositionGrid, bp.entities);
  });

  old.tiles.forEach(tile => {
    if (tile.changed || !MODIFIED_ONLY) bp.createTileWithData(tile.getData());
  });

  if (FLIP_X) {
    const MAP = {
      2: 6,
      6: 2,

      1: 7,
      7: 1,

      3: 5,
      5: 3
    };
    bp.entities.forEach(e => {
      /*if (e.name == 'train_stop') {
        e.position.x = -e.position.x + e.size.x;
        return;
      }*/
      e.position.x = -e.position.x - e.size.x;
      if (MAP[e.direction] != undefined) e.direction = MAP[e.direction];
    });
    bp.tiles.forEach(e => {
      e.position.x = -e.position.x - 1;
    });
    bp.fixCenter({ x: 1, y: 0 }); // In case of tracks
  }

  if (FLIP_Y) {
    const MAP = {
      0: 4,
      4: 0,

      1: 3,
      3: 1,

      5: 7,
      7: 5
    };
    bp.entities.forEach(e => {
      /*if (e.name == 'train_stop') {
        e.position.x = -e.position.x + e.size.x;
        return;
      }*/
      e.position.y = -e.position.y - e.size.y;
      if (MAP[e.direction] != undefined) e.direction = MAP[e.direction];
    });
    bp.tiles.forEach(e => {
      e.position.y = -e.position.y - 1;
    });
    bp.fixCenter({ x: 0, y: 1 }); // In case of tracks
  }

  return bp.encode();
}