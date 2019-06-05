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