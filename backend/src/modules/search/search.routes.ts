import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { cityPlacesSchema, searchCitiesSchema, trendingSchema } from './search.schema';
import * as searchCtrl from './search.controller';

const router = Router();

// GET /search/cities?q=paris&country=FR&limit=10
router.get('/cities', validate(searchCitiesSchema, 'query'), searchCtrl.searchCities);

// GET /search/city-places?name=Paris&country=France&lat=48.8566&lng=2.3522
router.get('/city-places', validate(cityPlacesSchema, 'query'), searchCtrl.getCityPlaces);

// GET /search/trending?limit=12
router.get('/trending', validate(trendingSchema, 'query'), searchCtrl.getTrending);

export default router;
