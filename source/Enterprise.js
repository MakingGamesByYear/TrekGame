class Enterprise extends GameObject
{
    canSeeEntity(entity)
    {
        return !this.components.ShortRangeSensors.isSectorCorrupt(entity.sectorX, entity.sectorY);
    }

    bombardPlanet(trekgame, planet)
    {
        console.assert(!planet.bombarded);

        if (this.torpedoes < TrekGame.BombardCost)
        {
            return false;
        }

        var klingonsMoved = 0;
        let klingonsToMove = Math.min(Math.min(Klingon.Instances, TrekGame.BombardReinforcementSize), trekgame.currentQuadrant.emptySquares());

        for (var q in trekgame.galaxyMap.contents)
        {
            let quadrant = trekgame.galaxyMap.lookup1D(q);
            let quadrantKlingons = quadrant.getEntitiesOfType(Klingon);

            if (quadrant == trekgame.currentQuadrant)
            {
                continue;
            }

            let shQuadrant = this.sensorHistory.lookup1D(q);
            
            for (var i = 0; i < Math.min(klingonsToMove - klingonsMoved, quadrantKlingons.length); i++)
            {
                let k = quadrantKlingons[i];
                quadrant.removeEntity(k);
                trekgame.currentQuadrant.addEntityInFreeSector(k);
                klingonsMoved++;

                // remove the enemy from the sensor history count -- 
                // i guess the enterprise could somehow scan where the enemy is warping in from?
                // from a gameplay standpoint i want only correct counts or question marks - not wrong info
                if (Klingon in shQuadrant)
                {
                    shQuadrant[Klingon]--;
                    //console.log("removing klingon sensor history");
                }
            }
        }

        console.log("Klingons moved : " + klingonsMoved);

        this.torpedoes -= TrekGame.BombardCost;

        planet.bombard();
    }

    componentDamageProbabilities()
    {
        var probArray = [];

        for (var key in this.components)
        {
            console.log("" + this.components[key].componentDamageProbability);
            probArray.push(this.components[key].componentDamageProbability);
        }

        console.assert(probArray.length == Object.keys(this.components).length);
        return probArray;
    }

    createComponents()
    {
        this.components =
        {
            WarpEngines : new WarpEnginesComponent(), 
            ShortRangeSensors: new ShortRangeSensorsComponent(),
            LongRangeSensors: new LongRangeSensorsComponent(),
            PhaserControl : new PhaserControlComponent(),
            PhotonTubes : new PhotonTubesComponent(),
            ShieldControl : new ShieldControlComponent(), 
            LibraryComputer : new LibraryComputerComponent()
        }
    }
    
    constructor()
    {
        super(Enterprise);
        this.torpedoes = Enterprise.StartTorpedoes;
        this.shields = Enterprise.StartShields;

        this.freeEnergy = Enterprise.StartEnergy;

        this.createComponents();

        this.hitNoShields = false;
        this.dockStarbase = null;
        this.sensorHistory = new SensorHistory();
        this.components.ShortRangeSensors.generateCorruptGrid();
    }

    // called on navigation
    autoRepairComponents()
    {
        for (var key in this.components)
        {
            let oldHealth = this.components[key].componentHealth;
            this.components[key].componentHealth += (randomInt(Enterprise.MinComponentRepairPerTurn, Enterprise.MaxComponentRepairPerTurn) / 100);
            this.components[key].componentHealth = Math.min(this.components[key].componentHealth, 1.0);

            if (this.components[key].componentHealth == 1.0 && oldHealth != 1.0)
            {
                gameOutputAppend("\n" + this.components[key].componentName + " fully repaired!");
            }
        }
    }

    repairRandomComponent()
    {
        var damagedComponents = [];

        for (var key in this.components)
        {
            if (this.components[key].componentHealth != 1.0)
            {
                damagedComponents.push(this.components[key]);
            }
        }

        console.log("Enterprise has " + damagedComponents.length + " damaged components");

        if (!damagedComponents.length)return;

        let componentToRepair = damagedComponents[randomInt(0, damagedComponents.length-1)];
        componentToRepair.componentHealth = 1.0;

        gameOutputAppend("\n"+componentToRepair.componentName + " has been fully repaired!");
    }

    undock(starbase)
    {
        this.dockStarbase = null;
    }

    dockWithStarbase(starbase)
    {
        console.log("dock with starbase");

        this.torpedoes = Enterprise.StartTorpedoes;
        this.freeEnergy = Enterprise.StartEnergy - this.shields;
        this.dockStarbase = starbase;

        gameOutputAppend("\nDocked with starbase.  Torpedoes and energy replenished.  The starbase's shields protect the Enterprise.");

        this.repairRandomComponent();
    }

    // is our total energy less than the minimum energy cost to get anywhere?
    isStranded()
    {
        return (this.freeEnergy + this.shields) < this.warpEnergyCost(1); // energy cost to travel one square.
    }

    isDestroyed()
    {
        return this.hitNoShields;
    }

    // suggested minimum shield level for the current battlefield, to survive at least one round of enemy fire
    suggestedMinShieldLevel(enemyList)
    {
        let possibleDamageSum = 0.0;

        for (var x in enemyList)
        {
            possibleDamageSum += enemyList[x].maxPhaserDamage();
        }

        return possibleDamageSum;
    }

    // is it possible for a single round of enemy fire to destroy the enterprise?
    isShieldLevelCritical(enemyList)
    {
        return !this.dockStarbase && (this.shields < this.suggestedMinShieldLevel(enemyList));
    }

    warpEnergyCost(numSectors)
    {
        return Enterprise.EnergyCostPerSector * numSectors;
    }
    
    // assumes that the input value has been previously checked for the appropriate range and available value
    setShieldLevel(newShields)
    {
        if ((newShields > this.freeEnergy + this.shields) || newShields < 0.0)
        {
            throw "Invalid value for shield level"; 
        }

        let adjustedShields = Math.min(this.components.ShieldControl.maxShields(), newShields);

        if (!(adjustedShields > 0))
        {
            gameOutputAppend("Sorry captain, we've taken too much damage to raise shields!");
        }
        if ((adjustedShields < newShields))
        {
            if ( (adjustedShields < ShieldControlComponent.MaxShields))
            {
                gameOutputAppend("\nBecause of damage to the deflector shields, we cannot raise shields above " + adjustedShields);
            }
            else
            {
                gameOutputAppend("\nCannot exceed the maximum shield level of " + adjustedShields);
            }

            newShields = adjustedShields;
        }

        this.freeEnergy += this.shields - newShields;
        this.shields = newShields;

        gameOutputAppend("\nShields set to " + this.shields + ".  " + this.freeEnergy + " free energy remaining.");
    }

    toString()
    {
        return "<*>";
    }

    static maxInstancesGame()
    {
        return 1;
    }

    static maxInstancesQuadrant()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }

    conditionString(game)
    {
        if (game.currentQuadrant.countEntitiesOfType(Klingon))
        {
            return "RED";
        }

        if ((this.freeEnergy + this.shields) < .1 * Enterprise.StartEnergy)
        {
            return "YELLOW";
        }

        return "GREEN";
    }

    passthroughDamage(energy)
    {
        // we want to map (as a starting guess, pre balance) 500 energy to a total wipeout of a component
        let passthroughDamage = energy * randomFloat(.001, .002);

        // random component index
        let idx = randomWithProbabilities(this.componentDamageProbabilities());

        let component = this.components[Object.keys(this.components)[idx]];

        component.passthroughDamage(this, passthroughDamage);

        gameOutputAppend(component.componentName + " hit.  Now at " + Math.floor(component.componentHealth*100) + "% integrity" );
    }

    onPhaserHit(energy, game)
    {
        if (this.dockStarbase)
        {
            gameOutputAppend("The starbase shields protect you from the incoming phaser fire.");
            return;
        }

        let hitRatio = energy / this.shields;

        if (this.shields < energy)
        {
            this.hitNoShields = true;
            this.shields = 0.0;

            return;
        }

        this.shields -= energy;
        gameOutputAppend("Shields at " + this.shields);

        if ((hitRatio > Enterprise.DamagePassthroughRatio) || Math.random() < Enterprise.RandomPassthroughRatio)
        {
            this.passthroughDamage(energy);
        }        
    }

    firePhasers(energy, game)
    {
        console.log("fire phasers");

        let targets = [];

        var x;
        for (x in Enterprise.PhaserTargets)
        {
            targets.push(...game.currentQuadrant.getEntitiesOfType(Enterprise.PhaserTargets[x]));
        }

        let enterprise = this;
        let targetsFiltered = targets.filter(function(item){return enterprise.canSeeEntity(item)});

        console.assert(energy <= this.freeEnergy);

        if (!targetsFiltered.length)
        {
            gameOutputAppend("\nUnable to lock phasers onto targets because of sensor damage!");
            return false;
        }

        this.freeEnergy -= energy;

        let endstr = targetsFiltered.length > 1 ? "s." : ".";
        gameOutputAppend("\nFiring phasers at " + targetsFiltered.length + " target" + endstr);
        
        let invisibleEnemies = targets.length - targetsFiltered.length;
        if (invisibleEnemies > 1)
        {
            gameOutputAppend("" + invisibleEnemies + " enemies not able to be targeted due to sensor damage!");
        }
        else if (invisibleEnemies == 1)
        {
            gameOutputAppend("" + 1 + " enemy not able to be targeted due to sensor damage!");
        }
      
        let damagePerTarget = energy / targetsFiltered.length;

        var x;
        for (x in targetsFiltered)
        {
            console.log("target");
            let target = targetsFiltered[x];
            let dist = this.distanceToObject(target);

            let damageAttenuated = damagePerTarget / dist;
            let damageFinal = Math.floor(randomFloat(2.0, 3.0) * damageAttenuated);

            if (this.components.PhaserControl.isHit())
            {
               target.onPhaserHit(damageFinal, game);
            }
            else
            {
                gameOutputAppend("Phasers miss!");
            }
        }

        if (!game.currentQuadrantScanned)
        {
            gameOutputAppend("\nRun combat sensor scan to see enemy shield levels.");
        }

        return true;
    }

    fireTorpedo(game, target)
    {
        if (this.freeEnergy >= Enterprise.TorpedoEnergyCost)
        {
            gameOutputAppend("\nFiring torpedoes towards subsector " + target.sectorString());
            let torpedoIntersection = game.currentQuadrant.intersectionTest(this.sectorX, this.sectorY, target.sectorX, target.sectorY, Infinity);
            this.torpedoes--;
            this.freeEnergy -= Enterprise.TorpedoEnergyCost;
            
            if (this.components.PhotonTubes.isHit() && torpedoIntersection.intersects != null)
            {
               torpedoIntersection.intersects.onTorpedoHit(game);
            }
            else
            {
                gameOutputAppend("\nThe torpedo missed!");
            }
        }
        else
        {
            //not enough energy
            gameOutputAppend("\nNot enough energy to fire torpedoes!");
        }
    }

    lrsStringEntityType(galaxyMap, entityType)
    {
        let header = "   ";
        for (let x = this.quadrantX - 1; x <= this.quadrantX + 1; x++)
        {
            header += padStringToLength((""+(x+1)), 6);
        }

        let border = "-------------------";
        let rval = header + "\n   " + border + '\n';

        for (let y = this.quadrantY - 1; y <= this.quadrantY + 1; y++)
        {
            rval += " " + (y+1) + " |";
            for (let x = this.quadrantX - 1; x <= this.quadrantX + 1; x++)
            {
                let quadrant = galaxyMap.lookup(x, y);
                if (quadrant)
                {
                    let k = quadrant.countEntitiesOfType(entityType);

                    if (x == this.quadrantX && y == this.quadrantY)
                    {
                        k = "" + k + "E";
                    }

                    rval += " " + padStringToLength(""+k, 3) + " |";
                }
                else
                {
                    rval += " *** |";
                }
            }
            rval += "\n   " + border + "\n";
        }
        return rval;
    }

    // long range scan
    lrsString(trekGame, galaxyMap)
    {
        let rval = trekGame.primeUniverse ? "\t KLINGONS" : "\t ENEMIES";
        
        rval += "\t\t  STARS\t\t\tSTARBASES\n";

        let klingonLRS = this.lrsStringEntityType(galaxyMap, Klingon);
        let starLRS = this.lrsStringEntityType(galaxyMap, Star);
        let starbaseLRS = this.lrsStringEntityType(galaxyMap, StarBase);

        let klingonLRSLines = klingonLRS.split('\n');
        let starLRSLines = starLRS.split('\n');
        let starbaseLRSLines = starbaseLRS.split('\n');

        console.assert(klingonLRSLines.length == starLRSLines.length);
        for (var x in klingonLRSLines)
        {
            rval += klingonLRSLines[x] + "\t" + starLRSLines[x] + "\t" + starbaseLRSLines[x] + '\n';
        }

        return rval;
    }

    warp(sectorXEnd, sectorYEnd, sectorsToTravel, game)
    {
        let energyRequired = this.warpEnergyCost(sectorsToTravel);

        if (this.freeEnergy < energyRequired)
        {
            gameOutputAppend("\nNot enough energy free to complete maneuver!");
            return false;
        }

        let intersection = game.currentQuadrant.intersectionTest(this.sectorX, this.sectorY, sectorXEnd, sectorYEnd)
           
        this.sectorX = Math.floor(intersection.lastX);
        this.sectorY = Math.floor(intersection.lastY);

        if (intersection.intersects != null)
        {
            gameOutputAppend("\nObstruction ahead.  Shutting down warp engines.");
        }

        if (!intersection.stepIterations)
        {
            return false;
        }

        let actualEnergy = this.warpEnergyCost(intersection.stepIterations);

        // get the energy cost of the sectors we actually travelled
        this.freeEnergy -= actualEnergy;

        return true;
    }

    damageReport()
    {
        if (!this.components.LibraryComputer.damageReportAvailable())
        {
            gameOutputAppend("\nDamage report unavailable due to computer damage!");
            return;
        }

        gameOutputAppend("\nDAMAGE REPORT:\n");
        gameOutputAppend("Component Integrity:")
        for (var key in this.components)
        {
            let component = this.components[key];
            gameOutputAppend("" + component.componentName + " : " + Math.round(component.componentHealth * 100) + "%");
        }

        gameOutputAppend("\n\nNOTES:\nRepair crews can repair 1-5% damage per stardate.  A starbase will fully repair a single component every stardate.");

        for (var key in this.components)
        {
            let component = this.components[key];
            component.damageReport();
        }
    }

    static ConstructFromJSData(jsData)
    {
        let rval = Object.create(Enterprise.prototype);
        Object.assign(rval, jsData);

        rval.sensorHistory = new SensorHistory();
        Object.assign(rval.sensorHistory, jsData.sensorHistory);

        rval.createComponents();

        for (var key in rval.components)
        {
            Object.assign(rval.components[key], jsData.components[key]);
        }

        rval.components.ShortRangeSensors.corruptGrid = new Grid();
        rval.components.ShortRangeSensors.corruptGrid.contents = jsData.components.ShortRangeSensors.corruptGrid.contents;

        return rval;
    }
}

Enterprise.StartTorpedoes = 10;
Enterprise.StartEnergy = 3000;
Enterprise.StartShields = 0;
Enterprise.TorpedoEnergyCost = 10;
Enterprise.EnemyScanCost = 10;
Enterprise.PhaserTargets = [Klingon];           // future extension : this list could be dynamic based on evolving gameplay alliances, etc :) 
Enterprise.EnergyCostPerSector = 1.0;           // Warp cost per sector moved
Enterprise.EnergyCostPerQuadrant = 10.0;        // Warp cost per quadrant moved
Enterprise.DamagePassthroughRatio = .25;        // if damage is 25% of shields or more, pass damage through to components
Enterprise.RandomPassthroughRatio = .25;        // 25% chance that damage will pass through to ship components regardless of shields
Enterprise.MinComponentRepairPerTurn = 1;       // integrity min autorepair per component
Enterprise.MaxComponentRepairPerTurn = 5;       // integrity max autorepair per component
