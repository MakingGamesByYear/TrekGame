class GalaxyMap extends Grid
{
    constructor(quadrantsX, quadrantsY, entityTypes)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        super(quadrantsX, quadrantsY, function(){return new Quadrant(quadrantWidthSectors,quadrantHeightSectors)});

        this.createMinimumInstances(entityTypes, quadrantsX, quadrantsY);

        for (let i = 0; i < quadrantsX*quadrantsY; i++)
        {
            this.lookup1D(i).createEntities(entityTypes);
        }
    }

    static ConstructFromJSData(jsData)
    {
        let rval = new GalaxyMap(mapWidthQuadrants, mapHeightQuadrants, []);

        var x;
        for (x in jsData.contents)
        {
            let entitiesQuadrantJS = jsData.contents[x];

            rval.contents[x].populateFromJSData(entitiesQuadrantJS);
        }

        return rval;
    }

    // long range scan
    mapString(galaxyMap, EntityType = Klingon, gameobject = null)
    {
        let border = "------";
        border = border.repeat(mapWidthQuadrants);
        let rval = border + '\n';

        for (let y = 0; y < mapHeightQuadrants; y++)
        {
            rval += "|";
            for (let x = 0; x < mapWidthQuadrants; x++)
            {
                let quadrant = galaxyMap.lookup(x, y);
                
                if (quadrant)
                {
                    console.log("not null");
                     
                    // klingons, starbases, stars
                    let k = quadrant.countEntitiesOfType(EntityType);

                    if (gameobject)
                    {
                        if (gameobject.quadrantX == x && gameobject.quadrantY == y)
                        {
                            // put an "E" on the map for the enterprise's current location
                            k += 'E';
                        }
                    }

                    rval += " " + padStringToLength(""+k, 3, ' ') + " |";
                }
                 else
                 {  console.log(" null");
                     rval += " *** |";
                 }
             }
             rval += "\n" + border + "\n";
         }
         return rval;
     }

    createMinimumInstances(entityTypes)
    {
        var x;
        for (x in entityTypes)
        {
            let etype = entityTypes[x];

            let instancesToCreate = etype.minInstancesGame() ;//- etype.Instances;

            // console.log("Creating min instances of " + etype.name + " : " + instancesToCreate);
            if (instancesToCreate > 0)
            {
                for (let i = 0; i < instancesToCreate; i++)
                {
                    let inst = new etype();
                    let randomQuadrant = randomInt(0, this.contents.length-1);

                    let instAssigned = false;
                    for (let quad = 0; quad < this.contents.length; quad++)
                    {
                        if (this.lookup1D(randomQuadrant).emptySquares())
                        {
                            this.lookup1D(randomQuadrant).addEntityInFreeSector(inst);
                            instAssigned = true;
                            break;
                        }

                        randomQuadrant = (randomQuadrant + 1 ) % this.contents.length;
                    }
                    
                    if (!instAssigned)
                    {
                        throw "Not enough space to assign minumum instances of " + etype.name;
                    }
                }
            }
        }
    }
}