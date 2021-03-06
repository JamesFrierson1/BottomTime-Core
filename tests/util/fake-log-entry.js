import fakeLogEntryAir from './fake-log-entry-air';
import faker from 'faker';
import LogEntry from '../../service/data/log-entry';

let diveNumber = 1;

const KnownTags = [
	'night',
	'shore',
	'boat',
	'searchAndRescue',
	'deep',
	'reef',
	'wreck',
	'cave',
	'training',
	'ice',
	'altitude',
	'freshWater',
	'saltWater'
];

function generateTags() {
	const tagsCount = faker.random.number({ min: 1, max: 6 });
	const tags = new Array(tagsCount);
	for (let i = 0; i < tags.length; i++) {
		tags[i] = faker.random.arrayElement(KnownTags);
	}

	return tags;
}

export default userId => {
	const bottomTime = faker.random.number({ min: 10, max: 70 });
	const totalTime = faker.random.number({ min: bottomTime, max: bottomTime + 8 });

	const averageDepth = faker.random.number({ min: 5, max: 36 });
	const maxDepth = faker.random.number({ min: averageDepth, max: averageDepth + 5 });

	return {
		userId,
		entryTime: faker.date.past(3).toISOString(),
		diveNumber: diveNumber++,
		bottomTime,
		totalTime,
		surfaceInterval: faker.random.number({ min: 7, max: 120 }),
		location: faker.fake('{{address.city}}{{address.citySuffix}}, {{address.stateAbbr}}'),
		site: faker.fake('{{address.cityPrefix}} {{name.lastName}}'),
		averageDepth,
		maxDepth,
		air: [ fakeLogEntryAir() ],
		decoStops: [
			{
				depth: 3,
				duration: faker.random.number({ min: 3, max: 15 })
			}
		],
		gps: {
			latitude: faker.random.number({ min: -90.0, max: 90.0 }),
			longitude: faker.random.number({ min: -180.0, max: 180.0 })
		},
		weight: {
			belt: faker.random.number({ min: 0, max: 27 }) / 10,
			integrated: faker.random.number({ min: 0, max: 27 }) / 10,
			backplate: faker.random.number({ min: 0, max: 45 }) / 10,
			ankles: faker.random.number({ min: 0, max: 90 }) / 100,
			correctness: faker.random.arrayElement([ 'good', 'too little', 'too much' ]),
			trim: faker.random.arrayElement([ 'good', 'feet down', 'feet up' ])
		},
		temperature: {
			surface: faker.random.number({ min: 20, max: 35 }),
			water: faker.random.number({ min: 3, max: 18 }),
			thermoclines: [
				{
					depth: faker.random.number({ min: 15, max: 25 }),
					temperature: faker.random.number({ min: -2, max: 3 })
				}
			]
		},
		rating: faker.random.number({ min: 1, max: 5 }),
		visibility: faker.random.number({ min: 1, max: 5 }),
		wind: faker.random.number({ min: 1, max: 5 }),
		current: faker.random.number({ min: 1, max: 5 }),
		waterChoppiness: faker.random.number({ min: 1, max: 5 }),
		weather: faker.random.arrayElement([
			'Sunny',
			'Cloudy',
			'Partly-Cloudy',
			'Raining',
			'Stormy',
			'Windy'
		]),
		suit: faker.random.arrayElement([
			'Rash guard',
			'Shorty',
			'3mm wetsuit',
			'5mm wetsuit',
			'7mm wetsuit',
			'Drysuit'
		]),
		tags: generateTags(),
		comments: faker.lorem.sentences(4)
	};
};

export function toLogEntry(fake) {
	const entry = new LogEntry(fake);
	if (fake.gps) {
		entry.gps = [
			fake.gps.longitude,
			fake.gps.latitude
		];
	}
	return entry;
}
