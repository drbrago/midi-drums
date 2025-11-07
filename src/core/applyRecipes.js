// src/core/applyRecipes.js
import * as foundation from "../../recipes/foundation.js";
import * as minimalize from "../../recipes/minimalize.js";
import * as industrialize from "../../recipes/industrialize.js";
import * as classicTom from "../../recipes/classicTom.js";
import * as ride from "../../recipes/ride.js";
import * as hhChoke from "../../recipes/hhChoke.js";
import * as ghostSnare from "../../recipes/ghostSnare.js";
import * as swing16th from "../../recipes/swing16th.js";
import * as euclidPerc from "../../recipes/euclidPerc.js";
import * as swingDrunk from "../../recipes/swingDrunk.js";
import * as humanizeLight from "../../recipes/humanizeLight.js";
import * as humanizeGroove from "../../recipes/humanizeGroove.js";
import * as humanizeChaotic from "../../recipes/humanizeChaotic.js";
import * as humanizeAcoustic from "../../recipes/humanizeAcoustic.js";
import * as humanizeVinyl from "../../recipes/humanizeVinyl.js";

const RECIPES = {
  foundation,
  minimalize,
  industrialize,
  classicTom,
  ride,
  hhChoke,
  ghostSnare,
  swing16th,
  euclidPerc,
  swingDrunk,
  humanizeLight,
  humanizeGroove,
  humanizeChaotic,
  humanizeAcoustic,
  humanizeVinyl,
};

export function listRecipes() {
  return Object.keys(RECIPES);
}

export function applyPipeline(pattern, pipeline) {
  const mod = RECIPES[pipeline.name];
  if (!mod?.apply) throw new Error(`Unknown recipe: ${pipeline.name}`);
  const patt = mod.apply(pattern, pipeline.params || {});
  patt.__post = (patt.__post || []).concat(
    mod.post
      ? [{ name: pipeline.name, fn: mod.post, params: pipeline.params }]
      : []
  );
  return patt;
}
