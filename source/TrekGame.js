class TrekGame
{
    static ConstructFromJSData(jsData)
    {
        try
        {
            let gamerval = Object.create(TrekGame.prototype);
            Object.assign(gamerval, jsData);

            gamerval.enterprise = Enterprise.ConstructFromJSData(jsData.enterprise);

            gamerval.galaxyMap = GalaxyMap.ConstructFromJSData(jsData.galaxyMap);

            // console.log("galaxy map : " + gamerval.galaxyMap);

            gamerval.currentSector = gamerval.galaxyMap.lookup(gamerval.enterprise.sectorX, gamerval.enterprise.sectorY);

            gamerval.currentSector.addEntity(gamerval.enterprise);

            gamerval.applySettings();

            gamerval.createMenus();

            gamerval.mapScreenGalaxy = false;

            gamerval.checkStarbaseDock();
            gamerval.checkPlanetBombard();

            if (gamerval.enterprise.dockStarbase)
            {
                gamerval.showDockMenu();
            }
            else
            {
                gamerval.setInputPrompt(gamerval.mainMenu.toString());
            }

            gamerval.updateDisplay();
            return gamerval;
        }
        catch(err)
        {
            console.log(err);
            console.log("Corrupt save file.  Erasing.");
            autosave(null);
            gameOutputAppend("Corrupt save file.  Refresh page to start new game.");
        }
    }

    parseGameSettings(gameSettings)
    {
        // default before parse
        this.primeUniverse = false;
        this.typingFree = false;

        this.primeUniverse = gameSettings["PrimeUniverse"] == 'true';
        this.typingFree = gameSettings["TypingFree"] == 'true';

        console.log("typing free : " + this.typingFree);
        console.log("prime universe : " + this.primeUniverse);
    }

    applySettings()
    {
        Menu.TypingFree = this.typingFree;
        Grid.TypingFree = this.typingFree;

        if (this.primeUniverse)
        {
            Planet.MaxInstances = 0;
            Planet.MinInstances = 0;
            Klingon.stringRepresentation = "+K+";
        }
        else
        {
            Klingon.stringRepresentation = "+F+";
        }

        if (this.typingFree)
        {
            this.disableInputKeepPrompt();
        }
    }

    constructor(gameSettings)
    {
        this.parseGameSettings(gameSettings);
        this.applySettings();

        this.gameOver = false;
        this.mapScreenGalaxy = false;

        this.galaxyMap = new GalaxyMap(mapWidthSectors, mapHeightSectors, TrekGame.EntityTypes);
        
        this.enterprise = new Enterprise();

        // start in a random sector
        this.enterprise.sectorX = randomInt(0, mapWidthSectors - 1);
        this.enterprise.sectorY = randomInt(0, mapHeightSectors - 1);
        this.enterprise.subsectorX = 0;
        this.enterprise.subsectorY = 0;
        
        this.currentSector = this.galaxyMap.lookup(this.enterprise.sectorX, this.enterprise.sectorY);

        this.currentSector.addEntityInFreeSubsector(this.enterprise);

        // pick a stardate between the start and end of TOS
        this.starDate = randomInt(1312, 5928);
        this.starDateBegin = this.starDate;
        this.endStarDate = this.starDate + TrekGame.BaseMissionTime + randomInt(0, TrekGame.MissionTimeSpread);

        this.currentSectorScanned = false;

        this.createMenus();
        this.setInputPrompt(this.mainMenu.toString());

        this.printStory();

        this.updateGame();

        autosave(this);
    }

    showDockMenu(sb)
    {
        let dockMenu = new Menu();
        let trekgame = this;

        dockMenu.options.push
        (
            new MenuOption
            (
                "1",
                ") ", 
                "STAY DOCKED (1 STARDATE, REPAIRS A COMPONENT)",
                function()
                {
                    trekgame.advanceStardate(1.0);
                    trekgame.enterprise.repairRandomComponent();
                    return false;
                }
            ),
            new MenuOption
            (
                "2",
                ") ",
                "UNDOCK",
                function()
                {
                    trekgame.enterprise.undock(sb);
                    gameOutputAppend("Undocking from starbase");

                    // explicitly doesn't take a stardate to do this action.

                    return true;
                }
            ),
            new MenuOption
            (
                "3", ") ", "DAMAGE REPORT", 
                function()
                {
                    trekgame.enterprise.damageReport();
                    return false;
                }
            ),
        );

        this.awaitInput
        (
            dockMenu.toString(),
            1,
            function(inputline){return dockMenu.chooseOption(inputline);}
        );
    }

    starbasesScan()
    {
        var sh = this.enterprise.sensorHistory;

        for (var x in StarBase.starbaseList)
        {
            let starbase = StarBase.starbaseList[x];
            sh.updateSensorHistoryForEntityTypes
            (
                [Star, Klingon], 
                this.galaxyMap, 
                starbase.sectorX-1, 
                starbase.sectorY-1, 
                starbase.sectorX+1, 
                starbase.sectorY+1
            );
        }
    }
    
    generateScore(gameWon)
    {
        let baseScore = 1000 * (Klingon.InstancesDestroyed / (1 + this.starDate - this.starDateBegin));
        let winMultiplier = 2.0;

        return gameWon ? Math.round(winMultiplier * baseScore) : Math.round(baseScore);
    }

    destroyKlingon(k)
    {
        gameOutputAppend(this.primeUniverse ? "Klingon Fighter Destroyed" : "Enemy vessel destroyed.");
        this.currentSector.removeEntity(k);
        Klingon.Instances--;
        Klingon.InstancesDestroyed++;
    }

    printStory()
    {
        if (this.primeUniverse)
        {
            var storyString = "The stardate is " + this.starDate + ".\n\nYou are the captain of the USS Enterprise.  " +
            "You have received word from Starfleet command of a plot by Klingon spies to destroy all the Federation " +
            "starbases in the region so the Klingon Empire can assume control.\n\n";

            storyString += 
            "The Federation is in danger and you are the only ship in range.\n\n"

            storyString+= 
            "Your mission is to hunt down and destroy the " + Klingon.Instances + " Klingon warships in the region.\n" + 
            "You must complete your mission before stardate " + this.endStarDate + ", giving you " + (this.endStarDate - this.starDate) + 
            " stardates to succeed.";

            if (StarBase.Instances > 1)
            {
                storyString += 
                "\n\nThere are " + StarBase.Instances + " Federation Starbases in the region for refueling, restocking torpedoes, and repairs.";
            }
            else
            {
                storyString += 
                "\n\nThere is " + StarBase.Instances + " Federation Starbase in the region for refueling, restocking torpedoes, and repairs.";
            }

            storyString += "\n\nCheck the ship's computer to access the captain's manual for a tutorial on how to complete your mission.";

            storyString += "\n\nGood luck, galactic peace is in your hands!";
            gameOutputAppend(storyString);
        }
        else
        {
            var storyString = "";

            storyString += "The stardate is " + this.starDate + ".\n\nYou are the captain of the ISS Enterprise.  " +
            "You have received word from Starfleet command of a plot by spies from a faction called the \"Federation\" to hack our starbases to spread " +
            "propaganda encouraging people to rebel against the Terran Empire. The Empire's external enemies want to use internal strife to make it easier to conquer and enslave.";
            storyString += "\n\nThis must be prevented at any cost.  ";

            storyString+= 
            "\n\nYour mission is to hunt down and destroy the " + Klingon.Instances + " Federation ships in the region.\n" + 
            "You must complete your mission before stardate " + this.endStarDate + ", giving you " + (this.endStarDate - this.starDate) + 
            " stardates to succeed.";

            if (StarBase.Instances > 1)
            {
                storyString += 
                "\n\nThere are " + StarBase.Instances + " Imperial Starbases in the region for refueling, restocking torpedoes, and repairs.";
            }
            else
            {
                storyString += 
                "\n\nThere is " + StarBase.Instances + " Imperial Starbase in the region for refueling, restocking torpedoes, and repairs.";
            }
            
            storyString += "\n\nIf you fail, the consequences to yourself will be severe.  Terror must be maintained or the Empire is doomed.";

            storyString += "\n\nCheck the ship's computer to access the captain's manual for a tutorial on how to complete your mission.";

            gameOutputAppend(storyString);
        }

        let enemyCount = this.currentSector.countEntitiesOfType(Klingon);
        if (enemyCount)
        {
            gameOutputAppend("\n=============================\n");
            gameOutputAppend("As you begin your mission, you find yourself in a sector with" + ((enemyCount > 1) ?  " enemy ships." : " an enemy ship."));
            gameOutputAppend("Prepare for combat!");
            this.sectorClearFirstTime = false;
        }
        else
        {
            gameOutputAppend("\n=============================\n");
            gameOutputAppend("As you begin your mission, you find yourself in a sector clear of enemy ships.  You will have to use navigation to jump to another sector to engage with the enemy.");
            gameOutputAppend("If the sectors adjacent to your ship are unexplored, you can use your long range sensors to try and find the enemy.");
            this.sectorClearFirstTime = true;
        }

    }

    printTutorial()
    {
        let tutorialMenu = new Menu();

        let trekGame = this;

        tutorialMenu.options.push
        (
            new MenuOption
            (
                "1", ") ", "TUTORIAL: MAIN DISPLAY",
                function()
                {
                    let tutorialString = "";

                    tutorialString += "DISPLAY:\nThe map display at the top of your screen shows the map of the galactic sector where your ship is located.  ";
                    tutorialString += "Your mission takes place in a region of the galaxy that is " + mapWidthSectors + " by " + mapHeightSectors + " sectors.";
                    tutorialString += "  A galactic sector is about 2 light years across.";

                    tutorialString += "\n\nThe sector map is made up of a grid of subsectors.  The X,Y coordinates of the subsectors are displayed across the horizontal and vertical axes of the map.  The key symbols corresponding to different objects occupying a subsector are listed below.";

                    tutorialString += "\n\nTo the right of the map screen are important stats about your mission, your ship's status, and your ship's location. ";

                    tutorialString += "\n\nBelow the map screen are important status flags, such as whether the shields are too low or whether we're at red alert when enemies are present. ";

                    tutorialString += "\n\nMap key :\n";

                    tutorialString += this.primeUniverse ? 
                    "<*> : ENTERPRISE\n*  : STAR\n+K+ : KLINGON\n>!< : STARBASE\n"
                    :
                    "<*> : ENTERPRISE\n*  : STAR\n+F+ : FEDERATION SHIP\n>!< : STARBASE\n";

                    gameOutputAppend(tutorialString);

                    trekGame.printTutorial();
                    return false;
                }
            ),

            new MenuOption("2", ") ", "TUTORIAL: SHIELDS AND TAKING DAMAGE",
                function()
                {
                    let tutorialString = "";

                    tutorialString += "\n\nSHIELDS:\nShield control will let you set the amount of the ship's energy you are committing to shields.  When shields are raised, they will absorb damage.";
                    tutorialString += "\n\nShield control (if sufficiently undamaged) will suggest a minimum shield level for the current combat situation.";
                    tutorialString += "\n\nYou can also reduce the damage you take by getting further from the enemy vessel.";
                    tutorialString += "\n\nDAMAGE:\nIf you take a hit from enemy phaser fire with no shields up, you will be destroyed.  As you take hits, various components of your ship ";
                    tutorialString += "may also degrade.  Each stardate, your repair teams will restore some small percentage of that component's integrity.  ";
                    tutorialString += "When a component's integrity gets low enough, you may see functionality impaired.  Check the damage report in the ship's computer ";
                    tutorialString += "to see both the current integrity of all your individual components as well as a list of any malfunctions.  \n\nYou can also get repairs at a starbase.";

                    gameOutputAppend(tutorialString);

                    trekGame.printTutorial();
                    return false;
                }
            ),

            new MenuOption("3", ") ", "TUTORIAL: STARBASES",
                function()
                {
                    let tutorialString = "";

                    tutorialString += "\n\STARBASES:\nDocking at a starbase will restore your energy and torpedoes to maximum and repair a random ship component to full integrity.  ";
                    tutorialString += "Each additional date docked at the starbase will fully repair an additional random component.  The starbase's shields will protect you from enemy fire so long as you are docked.";

                    tutorialString += "\n\nTo dock at a starbase, use a short range jump to navigate to a subsector adjacent to the starbase.  Then the option to dock will appear on the menu.\n\nA map of all the sectors containing starbases can be found in the ship's computer.";
                   
                    gameOutputAppend(tutorialString);

                    trekGame.printTutorial();
                    return false;
                }
            ),

            new MenuOption("4", ") ", "TUTORIAL: NAVIGATION",
                function()
                {
                    let tutorialString = "";

                    tutorialString += "\n\nNAVIGATION:\nA short range jump lets you warp to a different subsector in the current sector (eg. a different location on the current map screen). ";
                    tutorialString += "\nA long range jump lets you warp to a different sector in the galaxy (eg. change to a different map screen). ";
                    tutorialString += "\n\nA short range jump needs a clear path to the target subsector or you will exit warp.  A long range jump will take you to a random subsector of your destination sector, and will ignore any obstacles along the way.";
                    tutorialString += "\n\nBoth a short range and long range jump require more energy the further you attempt to travel.";
                    tutorialString += "\n\nIf you are in a sector with enemies, make sure you raise your shields before making a short range jump.";
            
                    gameOutputAppend(tutorialString);

                    trekGame.printTutorial();
                    return false;
                }
            ),


            new MenuOption("5", ") ", "TUTORIAL: MAPS AND SENSORS",
                function()
                {
                    let tutorialString = "";

                    tutorialString += "\n\MAPS:\n";
                    tutorialString += "Galaxy maps can be found in the ship's computer.\n\nThe starbase map shows the sectors that contain a starbase.  The locations of all starbases are known at the beginning of your mission.";
                    
                    if (this.primeUniverse)
                    {
                        tutorialString += "\n\nThe klingons map shows the number of enemies in each sector based on your previous long range scans.  Starbases also do a continous long range scan and update your map.  Uncharted sectors display a question mark.";
                    }
                    else
                    {
                        tutorialString += "\n\nThe enemy locations map shows the number of enemies in each sector based on your previous long range scans.  Starbases also do a continous long range scan and update your map.  Uncharted sectors display a question mark.";
                    }
                    tutorialString += "\n\nThe star density map shows the number of stars in each sector based on your previous long range scans.  Starbases also do a continous long range scan and update your map.  Uncharted sectors display a question mark.";
                    tutorialString += "\nThe galaxy maps in the ship computer show an E in the sector corresponding to the location of your ship.";

                    tutorialString += "\n\nSENSORS:";
                    tutorialString += "\nLong range sensors scan the 3x3 region of sectors surrounding your ship for stars and enemies, then updates the maps in the library computer.";                    
                    tutorialString += "\n\nCombat sensors will tell you the shield level of enemies in the sector, and the estimated phaser energy needed to destroy them.";
                    tutorialString += "\nYou only need to pay the energy cost of the scan once, until you leave the sector.  The ship's computer will automatically update the values as combat unfolds.\nYou can consult the scan anytime for up to date values."
            
                    gameOutputAppend(tutorialString);

                    trekGame.printTutorial();
                    return false;
                }
            ),

            new MenuOption("6", ") ", "TUTORIAL: WEAPONS",
                function()
                {
                    let tutorialString = "";

                    tutorialString += "\n\WEAPONS:\nTorpedoes will instantly destroy a single enemy vessel on impact.  ";
                    tutorialString += "They cannot pass through stars or other obstructions though, and you have a limited supply (that can be replenished at a starbase).  ";
                    tutorialString += "You should use a short range jump to navigate to a location with a clear shot.  \n\nThe targeting computer will list ";
                    tutorialString += "all the targets in the sector for you to choose from.  If the targeting computer is damaged, you may need to target the torpedoes manually.";
                    tutorialString += "\n\nPhasers ignore obstructions and target all targets in the sector at the same time.  To fire phasers you must commit some portion of your free energy to the phaser blast.\n\n";
                    tutorialString += "The more targets in the sector and the further away you are from them, the more energy you will need to commit to do the same amount of damage.";
            
                    gameOutputAppend(tutorialString);

                    trekGame.printTutorial();
                    return false;
                }
            ),

            new MenuOption("7", ") ", "BACK",
                function()
                {
                    return true;
                }
            )
        );

        this.awaitInput(tutorialMenu.toString(), 1, function(inputline){return tutorialMenu.chooseOption(inputline);});
        return false;
    }

    changeToSector(qX, qY)
    {
        this.currentSectorScanned = false;

        this.currentSector.removeEntity(this.enterprise);
        this.currentSector = this.galaxyMap.lookup(qX, qY);
        this.currentSector.addEntityInFreeSubsector(this.enterprise);

        gameOutputAppend("\nEntering galactic sector " + this.enterprise.sectorString());
    }

    statusString()
    {
        return "<pre>" +
        "\n\n\n" + 
        "STARDATES REMAINING   " + (this.endStarDate - this.starDate) +"\n" +
        "SECTOR (X,Y)          " + (this.enterprise.sectorY+1) +  ',' + (this.enterprise.sectorY+1) + '\n' + 
        "SUBSECTOR (X,Y)       " + (this.enterprise.subsectorX+1) +  ',' + (this.enterprise.subsectorY+1) + "\n" + 
        "PHOTON TORPEDOES      " + this.enterprise.torpedoes + '\n' + 
        "SHIELD ENERGY         " + this.enterprise.shields + '\n' + 
        "FREE ENERGY           " + this.enterprise.freeEnergy + '\n' + 
        (this.primeUniverse ? "KLINGONS REMAINING    " : "TRAITORS REMAINING    ")
        + Klingon.Instances + '\n' + 
        "STARBASES REMAINING   " + StarBase.Instances + '\n' +
        "</pre>";
    }

    setInputPrompt(newprompt)
    {
        document.getElementById("inputPrompt").innerHTML = newprompt;
    }

    bombardPlanet()
    {
        let adjacentPlanets = this.currentSector.getAdjacentEntitiesOfType(this.enterprise, Planet);
        console.assert(adjacentPlanets.length);

        let p = adjacentPlanets[0];

        if (this.enterprise.bombardPlanet(this, p))
        {
            this.advanceStardate(1.0);
        }
    }

    shieldHandler(inputline)
    {
        let parsedVal = parseInt(inputline);

        if (isNaN(parsedVal) || parsedVal < 0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }
        if (parsedVal > (this.enterprise.shields + this.enterprise.freeEnergy))
        {
            gameOutputAppend("We don't have enough energy for that, captain!");
            return false;
        }
        
        //gameOutputAppend(""+parsedVal);

        this.enterprise.setShieldLevel(parsedVal);

        this.combatStep();

        return true;
    }


    // finalHandler has prototype (game, x, y)
    getSubsectorMenu(finalHandler)
    {
        let promptstringX = "Enter destination subsector X coordinate.  Enter a value between 1 and " + sectorWidthSubsectors;
        let promptstringY = "Enter destination subsector Y coordinate.  Enter a value between 1 and " + sectorHeightSubsectors;

        let trekgame = this;

        let yhandler = function(inputline, subsectorX)
        {
            let subsectorY = parseInt(inputline) - 1;

            if ((subsectorY == null) || isNaN(subsectorY) || subsectorY < 0 || subsectorY >= sectorHeightSubsectors)
            {
                gameOutputAppend("Invalid value!");
                return false;
            }

            return finalHandler(game, subsectorX, subsectorY);
        };

        let xhandler = function(inputline)
        {
            let subsectorX = parseInt(inputline) - 1;

            if ((subsectorX == null) || isNaN(subsectorX) || subsectorX < 0 || subsectorX >= sectorWidthSubsectors
        )
            {
                gameOutputAppend("Invalid value!");
                return false;
            }

            this.awaitInput
            (
                promptstringY,
                2, 
                function(inputline)
                {
                    return yhandler(inputline, subsectorX)
                }
            );
            
            return false;
        }

        this.awaitInput(
            promptstringX,
            2,
            xhandler
        );

    }

    navigationHandlerLongRangeX(inputline)
    {
        console.log("nav");
        let sectorX = parseInt(inputline) - 1;

        if ((sectorX == null) || isNaN(sectorX) || sectorX < 0 || sectorX >= mapWidthSectors)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.awaitInput(
            "Enter destination sector Y coordinate.  Enter a value between 1 and " + mapHeightSectors,
            2, 
            
            function(inputline)
            {
                return this.navigationHandlerLongRangeY(inputline, sectorX);
            }
        );
        
        return false;
    }

    navigationHandlerLongRangeY(inputline, sectorX)
    {
        let sectorY = parseInt(inputline) - 1;

        if ((sectorY == null) || isNaN(sectorY) || sectorY < 0 || sectorY >= mapHeightSectors)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.longRangeJump(sectorX, sectorY);
    }

    manualPhaserEntry()
    {
        let freestring = "\nFREE ENERGY : " + this.enterprise.freeEnergy;
                        
        let accuracy = this.enterprise.components.PhaserControl.phaserAccuracy() * 100;
        let chanceToHitString = "PHASER CHANCE TO HIT : " + accuracy + "%";
        
        this.awaitInput(chanceToHitString + "\nENTER ENERGY TO EXPEND ON PHASER FIRE"+freestring, 4, this.phaserHandler, true);

        return false;
    }

    longRangeJump(sectorX, sectorY)
    {
        let xd = sectorX - this.enterprise.sectorX;
        let yd = sectorY - this.enterprise.sectorY;
        let travelDistance = Math.sqrt(xd*xd + yd*yd);  // assumes single stardate.  so distance and speed have the same scalar value.

        let maxSpeed = this.enterprise.components.WarpEngines.maxSpeed();

        if (!this.enterprise.components.WarpEngines.fullyFunctional() && (travelDistance > maxSpeed))
        {
            xd /= travelDistance;
            yd /= travelDistance;

            xd *= maxSpeed;
            yd *= maxSpeed;
            
            travelDistance = Math.sqrt(xd*xd + yd*yd);

            sectorX = Math.floor(this.enterprise.sectorX + xd);
            sectorY = Math.floor(this.enterprise.sectorY + yd);

            gameOutputAppend("Unable to make it to the destination warp target in a single jump due to damage.  New destination is Sector " + (sectorX+1) + ", " + (sectorY+1));
        }

        let jumpEnergyRequired = Math.floor(Enterprise.EnergyCostPerSector * travelDistance);

        if (this.enterprise.freeEnergy < jumpEnergyRequired)
        {
            gameOutputAppend("Insufficient energy for long range jump, captain.  Jump requires " + jumpEnergyRequired + " free energy.");
            return true;
        }

        let sensorHistory = this.enterprise.sensorHistory.lookup(sectorX, sectorY);
        
        if (Klingon in sensorHistory)
        {
            gameOutputAppend("\nThe destination sector " + "(" + (1+sectorX) + ',' + (1+sectorY) +  ")" + " contains the following: ");

            if (sensorHistory[Klingon] > 0)
            {
                gameOutputAppend( (this.primeUniverse ? "Klingons : " : "Enemy vessels : ") + sensorHistory[Klingon]);
            }

            if (this.galaxyMap.lookup(sectorX, sectorY).countEntitiesOfType(StarBase) > 0)
            {
                gameOutputAppend("Starbases : 1");
            }

            if (sensorHistory[Star] > 0)
            {
                gameOutputAppend("Stars : " + sensorHistory[Star]);
            }
        }
        else
        {
            gameOutputAppend("\nThe destination sector " + "(" + (1+sectorX) + ',' + (1+sectorY) +  ")" + " is unexplored.");
        }

        let trekgame = this;
        let confirmMenu = new Menu();
        confirmMenu.options.push
        (
            new MenuOption
            (
                "1", 
                ") ", 
                "CONFIRM JUMP TO SECTOR " + (sectorX+1) + ", " + (sectorY+1) + ".\nTRIP TAKES 1 STARDATE, " + jumpEnergyRequired + " ENERGY\n",
                function()
                {
                    trekgame.mapScreenGalaxy = false;
                    trekgame.gridHandler = null;

                    trekgame.enterprise.freeEnergy -= jumpEnergyRequired;
                    trekgame.changeToSector(sectorX, sectorY);
                    trekgame.advanceStardateNoCombat(1.0); // don't get blown up as soon as we enter a new Sector!
                    return true;
                }
            ),

            new MenuOption
            (
                "2",
                ") ",
                "CANCEL",
                function()
                {
                    trekgame.gridHandler = null;
                    trekgame.mapScreenGalaxy = false;
                    return true;
                }
            )
        );

        this.awaitInput(confirmMenu.toString(), 1, function(inputline){return confirmMenu.chooseOption(inputline);});
        return false;
    }

    shortRangeNavigationHandler(trekgame, subsectorX, subsectorY)
    {
        let subsectorsToTravel = trekgame.enterprise.distanceToSubsectorLoc(subsectorX, subsectorY);

        let confirmFunc = function()
        {
            if (trekgame.enterprise.warp(subsectorX, subsectorY, subsectorsToTravel, trekgame))
            {
                gameOutputAppend("\nComing out of warp in subsector " + trekgame.enterprise.subsectorString());
                trekgame.advanceStardate(1.0);
            }

            trekgame.gridHandler = null;

            return true;
        }

        let jumpEnergyRequired = Math.round(trekgame.enterprise.warpEnergyCost(subsectorsToTravel));

        let confirmMenu = new Menu();
        confirmMenu.options.push
        (
            new MenuOption
            (
                "1", 
                ") ", 
                "CONFIRM JUMP TO SUBSECTOR " + (subsectorX+1) + ", " + (subsectorY+1) + ".\nTRIP TAKES 1 STARDATE, " + jumpEnergyRequired + " ENERGY\n",
                confirmFunc
            ),

            new MenuOption
            (
                "2",
                ") ",
                "CANCEL",
                function()
                {
                    return true;
                }
            )
        )
        
        trekgame.awaitInput(confirmMenu.toString(), 1, function(inputline){return confirmMenu.chooseOption(inputline);});
        return false;
    }

    scanEnemyShips()
    {
        if (this.enterprise.freeEnergy < Enterprise.EnemyScanCost)
        {
            gameOutputAppend("\nNot enough energy to scan the enemy ships, captain!");
            return;
        }

        let enemylist = this.currentSector.getEntitiesOfType(Klingon);

        if (!enemylist.length)
        {
            gameOutputAppend("\nNo enemies in this sector to scan, captain!");
            return;
        }

        this.enterprise.freeEnergy -= Enterprise.EnemyScanCost;
        this.currentSectorScanned = true;

        gameOutputAppend("\nENEMY SHIP SCANNER REPORTS");

        let e_max_of_min = 0;
        let e_max_of_max = 0;

        let allEnemiesVisible = true;

        for (var x in enemylist)
        {
            let k = enemylist[x];

            // invert the enterprise phaser equations to get the estimate 
            ///\todo make this a subfunction of Enterprise...

            let kshields = k.shields;
            let dist_to_k = this.enterprise.distanceToObject(k);

            let minRandom = 2.0;
            let maxRandom = 3.0;

            let e_required_max = dist_to_k * kshields / minRandom;
            let e_required_min = dist_to_k * kshields / maxRandom;

            e_max_of_min = Math.max(e_required_min, e_max_of_min);
            e_max_of_max = Math.max(e_required_max, e_max_of_max);
            
            let entityVisible = this.enterprise.canSeeEntity(k);
            if (!entityVisible)
            {
                allEnemiesVisible = false;
                gameOutputAppend("\n---SENSOR CORRUPTION DETECTED!---");
                gameOutputAppend("Enemy in subsector : ???");
                gameOutputAppend("Enemy shield level : ????");
                gameOutputAppend("Phaser energy to destroy : ??????");
            }
            else
            {
                gameOutputAppend("\nEnemy in subsector (" + k.subsectorString() + ")");
                gameOutputAppend("Enemy shield level : " + kshields);
                gameOutputAppend("Phaser energy to destroy : " + Math.round(e_required_min) + "-" + Math.round(e_required_max));
            }
        }

        gameOutputAppend("\nTotal enemies : " + enemylist.length);
        
        if (allEnemiesVisible)
        {
            gameOutputAppend("Total energy to destroy : " + Math.round(enemylist.length * e_max_of_min) + "-" + Math.round(enemylist.length * e_max_of_max));
        }
        else
        {
            gameOutputAppend("Total energy to destroy : ?????");
        }
        gameOutputAppend("\n");
    }

    longRangeScan()
    {
        if (!this.enterprise.components.LongRangeSensors.functional())
        {
            gameOutputAppend("\nLong range scan unavailable due to damage.");
            return;
        }

        gameOutputAppend("\nLong Range Scan completed.");
        gameOutputAppend("Adjacent sectors have been scanned.  The ship's computer has been updated with the following information:\n");
        gameOutputAppend(this.enterprise.lrsString(this, this.galaxyMap));

        var sh = this.enterprise.sensorHistory;
        sh.updateSensorHistoryForEntityTypes
        (
            [Star, Klingon], 
            this.galaxyMap, 
            this.enterprise.sectorX-1, 
            this.enterprise.sectorY-1, 
            this.enterprise.sectorX+1, 
            this.enterprise.sectorY+1
        );

        this.advanceStardate(1.0);
    }

    manualTorpedoHandler()
    {
        let tfunc = function(trekgame, x, y){
            let gobj = new GameObject();
            gobj.subsectorX = x;
            gobj.subsectorY = y;
            trekgame.torpedoHandler(gobj)
            return true;
        };

        if (!this.typingFree)
        {
            this.getSubsectorMenu(tfunc);
        }
        else
        {
            let trekgame = this;
            this.gridHandler = function(x,y)
            {
                tfunc(trekgame,x,y);
                trekgame.gridHandler = null;
                trekgame.awaitInput(trekgame.mainMenu.toString());
            };

            this.showBackMenu("SELECT TORPEDO DESTINATION ON THE MAP");
        }
    }

    showBackMenu(headerString)
    {
        let backMenu = new Menu();
        let trekgame = this;

        backMenu.headerString = headerString;
        backMenu.options.push
        (
            new MenuOption
            (
                "1",
                ") ",
                "BACK",
                function()
                {
                    trekgame.gridHandler = null;
                    trekgame.mapScreenGalaxy = false;
                    return true;
                }
            )
        );

        this.showMenu(backMenu);
    }

    showMenu(menu)
    {
        this.awaitInput(menu.toString(), 1, function(inputline){return menu.chooseOption(inputline)});
    }

    torpedoHandler(target)
    {
        this.enterprise.fireTorpedo(this, target);

        this.combatStep();

        return true;
    }

    phaserHandler(inputline)
    {
        let energy = parseInt(inputline);

        if ((energy == null) || isNaN(energy) || energy < 0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.firePhasersEnergy(energy);

        return true;
    }

    firePhasersEnergy(energy)
    {
        if (energy > this.enterprise.freeEnergy)
        {
            gameOutputAppend("Not enough energy, captain!");
            return false;
        }

        if (energy == 0)
        {
            return true;
        }

        if (this.enterprise.firePhasers(energy, this))
        {
            this.combatStep();
        }
    }

    combatStep()
    {
        this.currentSector.klingonsFire(this.enterprise, this);
        this.enterprise.components.ShortRangeSensors.generateCorruptGrid();
    }

    updateStatus()
    {
        document.getElementById("status").innerHTML = this.statusString();
        document.getElementById("status").style.display = "inline-block";
    }

    hideStatus()
    {
        document.getElementById("status").style.display = "None";
    }

    awaitInput(inputPrompt, charactersToRead=3, inputHandler=null, override=false)
    {
        document.getElementById("inputPrompt").style.display="Block";
        
        if (!this.typingFree || override)
        {
            document.getElementById("gameInput").style.display="Block";
            document.getElementById("inputButton").style.display ="Block";
        }
        else
        {
            document.getElementById("gameInput").style.display="None";
            document.getElementById("inputButton").style.display ="None";
        }

        this.inputHandler = inputHandler;
        document.getElementById("gameInput").maxLength = charactersToRead;
        this.setInputPrompt(inputPrompt);
    }

    disableInput()
    {
        document.getElementById("inputPrompt").style.display="None";
        document.getElementById("gameInput").style.display="None";
        document.getElementById("inputButton").style.display ="None";
    }

    disableInputKeepPrompt()
    {
        document.getElementById("gameInput").style.display="None";
        document.getElementById("inputButton").style.display ="None";
    }

    handleInput(inputStr)
    {
        if (this.inputHandler)
        {
            if (this.inputHandler(inputStr))
            {
                this.awaitInput(this.mainMenu.toString(), 3, null);
            }
        }
        else
        {
            this.mainMenu.chooseOption(inputStr);
        }
    }

    gameInput(inputStr)
    {
        //console.log(">"+inputStr+"\n");
        //gameOutputAppend(inputStr);

        this.handleInput(inputStr);

        this.updateGame();
        autosave(this);
    }

    updateDisplay()
    {
        if (this.mapScreenGalaxy)
        {
            this.hideStatus();
            updateMap(this.updateMapScreenGalaxy());
            updateMapHeader("GALAXY MAP : CHOOSE DESTINATION SECTOR");
            //updateMap(this.updateMapScreenGalaxy());
            
            if (this.primeUniverse)
            {
                updateMapFooter("E: ENTERPRISE | K : KLINGONS | S : STARBASE | ? : UNEXPLORED");
            }
            else
            {
                updateMapFooter("E: ENTERPRISE | F : FEDERATION SPIES | S : STARBASE | ? : UNEXPLORED");
            }
        }
        else
        {
            this.updateStatus();
            updateMap(this.updateMapScreen());
            updateMapHeader("SECTOR : " + this.enterprise.sectorString());
            updateMapFooter(this.updateStatusFlags());
        }

        onResize();
    }

    checkStarbaseDock()
    {
        if (this.enterprise.dockStarbase)
        {
            console.log("already docked.");
            return;
        }

        this.mainMenu.dockOption.enabled = false;

        let starbases = this.currentSector.getEntitiesOfType(StarBase);

        for (var x in starbases)
        {
            var sb = starbases[x];

            if (this.enterprise.isAdjacentTo(sb))
            {
                console.log("adjacent");
                this.mainMenu.dockOption.enabled = true;
            }
            else
            {
                console.log("not adjacent");
            }
        }

        if (!this.inputHandler)
        {
            this.awaitInput(this.mainMenu.toString(), 3, null);
        }
    }

    checkPlanetBombard()
    {
        if (this.enterprise.dockStarbase)
        {
            return;
        }

        this.mainMenu.bombardOption.enabled = false;

        let planets = this.currentSector.getEntitiesOfType(Planet);

        for (var x in planets)
        {
            var p = planets[x];

            if (this.enterprise.isAdjacentTo(p) && !p.bombarded)
            {
                this.mainMenu.bombardOption.enabled = true;
            }
        }

        if (!this.inputHandler)
        {
            this.awaitInput(this.mainMenu.toString(), 3, null);
        }
    }

    updateGame()
    {
        this.updateDisplay();
        this.starbasesScan();
        this.enterpriseShortRangeScan();
        this.checkStarbaseDock();
        this.checkPlanetBombard();

        this.checkEndConditions();
    }

    enterpriseShortRangeScan()
    {
        this.enterprise.sensorHistory.updateSensorHistoryForEntityTypes
            (
                [Star, Klingon], 
                this.galaxyMap, 
                this.enterprise.sectorX, 
                this.enterprise.sectorY, 
                this.enterprise.sectorX, 
                this.enterprise.sectorY
            );
    }

    endGame()
    {
        this.gameOver = true;
        autosave(null);
        gameOutputAppend("\nThanks for playing!  Refresh the page to play again.");
        this.disableInput();
    }

    advanceStardate(adv)
    {
        this.combatStep();
        this.advanceStardateNoCombat(adv);
    }

    advanceStardateNoCombat(adv)
    {
        this.starDate += adv;
        this.enterprise.autoRepairComponents();

        let stardatesRemaining = (this.endStarDate - this.starDate);

        if (stardatesRemaining == 10)
        {
            gameOutputAppend("\nYou have 10 stardates remaining to complete your mission!");
        }
        else if (stardatesRemaining == 5)
        {
            gameOutputAppend("\nWARNING : 5 STARDATES REMAIN.");
        }
        else if (stardatesRemaining == 1)
        {
            gameOutputAppend("" + stardatesRemaining + " STARDATE LEFT!");
        }
        else if (stardatesRemaining <= 3)
        {
            gameOutputAppend("" + stardatesRemaining + " STARDATES LEFT!");
        }
    }

    checkEndConditions()
    {
        if (this.gameOver) return;

        if (this.starDate >= this.endStarDate)
        {
            gameOutputAppend("\n\n============================GAME OVER============================\n");
            
            if (this.primeUniverse)
            {
                gameOutputAppend("You were unable to complete your mission in time.");
                gameOutputAppend("The Klingons were able to execute their plan to destroy the Federation starbases!");
                gameOutputAppend("You'll be demoted for sure!");
            }
            else
            {
                gameOutputAppend("You were unable to complete your mission in time.");
                gameOutputAppend("The Federation ships were able to execute their plan.  Reports of civil unrest and insurrection start coming in from throughout the Terran Empire.");
                gameOutputAppend("\nYour second in command and his henchmen are waiting to assassinate you in your quarters.");
                gameOutputAppend("The Enterprise gets a better captain and everyone else moves up in rank.  You have paid the price for your failures.");
            }

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));

            this.endGame();
        }
        else if (this.enterprise.isStranded())
        {
            gameOutputAppend("\n\n============================GAME OVER============================\n");
            gameOutputAppend("You have insufficient energy to power the warp engines!");
            gameOutputAppend("You are stranded, causing you to ultimately fail your mission.");

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));
            
            this.endGame();
        }
        else if (this.enterprise.isDestroyed())
        {
            gameOutputAppend("\n\n============================GAME OVER============================\n");
            gameOutputAppend("Your vessel has taken too much damage and has been destroyed.");
            gameOutputAppend("Your mission is failed.");

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));

            this.endGame();
        }
        else if (!StarBase.Instances)
        {
            gameOutputAppend("\n\n============================\GAME OVER============================\n");
            
            if (this.primeUniverse)
            {
                gameOutputAppend("All the Federation starbases have been destroyed!");
                gameOutputAppend("You've failed in your mission.  The Federation is doomed.");
            }
            else
            {
                gameOutputAppend("All the Imperial starbases have been destroyed!");
                gameOutputAppend("Insurgents from planets under the Empire's control take advantage of the power vacuum and take control of the region.");
                gameOutputAppend("The Empire has been seriously harmed by your incompetence");
                gameOutputAppend("\nYour second in command and his henchmen are waiting to assassinate you in your quarters.");
                gameOutputAppend("The Enterprise gets a better captain and everyone else moves up in rank.  You have paid the price for your failures.");
            }

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));

            this.endGame();
        }
        else if (!Klingon.Instances)
        {
            gameOutputAppend("\n\n============================YOU WIN!!============================\n");
            gameOutputAppend("You've managed to destroy all the enemy vessels, preventing the enemy from executing their plan!");
            gameOutputAppend("You're sure to get a promotion!");
            
            if (this.primeUniverse)
            {
                gameOutputAppend("Congratulations on your victory!");
            }
            else
            {
                gameOutputAppend("Terror has been maintained!");
            }

            gameOutputAppend("\nFinal Score : " + this.generateScore(true));
            
            this.endGame();
        }
    }
    
    createMenus()
    {
        this.mainMenu = new MainMenu(this);
        this.computerMenu = new ShipComputerMenu(this);
    }


    updateStatusFlags()
    {
        let flags = [];
        
        if (this.enterprise.dockStarbase)
        {
            flags.push("DOCKED");
        }

        if (this.currentSector.countEntitiesOfType(Klingon))
        {
            flags.push("RED ALERT");

            let estAvail = this.enterprise.components.ShieldControl.estimateAvailable();
            let critical = this.enterprise.isShieldLevelCritical(this.currentSector.getEntitiesOfType(Klingon));

            if (estAvail && critical)
            {
                flags.push("SHIELDS CRITICAL");
            }
        }
        else
        {
            flags.push("SECTOR CLEAR");

            // tutorial pro tip.
            if (!this.sectorClearFirstTime)
            {
                this.sectorClearFirstTime = true;
                gameOutputAppend("You find yourself in a sector clear of enemy ships.  You will have to use navigation to jump to another sector to engage with the enemy.");
                gameOutputAppend("If the sectors adjacent to your ship are unexplored, you can use your long range sensors to try and find the enemy.");
            }
            
        }

        return flags.join(" | ");
    }

    updateMapScreenGalaxy()
    {
        let topStr = "---------";
        let topStrLong = ' ' + topStr.repeat(mapWidthSectors-1);

        let rval = "<pre>" + '\n' + topStrLong + '\n';

        for (var y = 0; y < mapHeightSectors; y++)
        {
            rval += '|';
            for (var x = 0; x < mapWidthSectors; x++)
            {

                rval += "<a href=\"javascript:clickGridHandler(" + x + ","+ y +")\" style=\"color: rgb(0,255,0); text-decoration: none;\">";

                let coordstr = "("+(x+1)+","+(y+1)+")";
                rval += padStringToLength(coordstr, 7);

                rval += "</a>";

                rval += '|';
            }

            rval += '\n|';

            for (var x = 0; x < mapWidthSectors; x++)
            {
                rval += "<a href=\"javascript:clickGridHandler("+x+","+y+")\" style=\"color: rgb(0,255,0); text-decoration: none;\">";

                let identifiers = '';

                let sensorHistory = this.enterprise.sensorHistory.lookup(x,y);

                if (Klingon in sensorHistory)
                {
                    if ((this.enterprise.sectorX == x) && (this.enterprise.sectorY == y))
                    {
                        identifiers+= 'E';
                    }

                    if (sensorHistory[Klingon] > 0)
                    {
                        identifiers += this.primeUniverse ? 'K' : 'F';
                    }

                    if (this.galaxyMap.lookup(x,y).countEntitiesOfType(StarBase) > 0)
                    {
                        identifiers += 'S';
                    }
                }
                else
                {
                    identifiers += '?';
                }
                
              

                rval += padStringToLength(identifiers,7);

                rval += "</a>";

                rval += '|';
            }

            //rval += '|';

            rval += '\n' + topStrLong + '\n';
        }

        rval += "</pre>";

        return rval;
    }

    updateMapScreen()
    {
        let sect = this.currentSector;

        let borderStringPost = "   " + mapFooter(sectorWidthSubsectors);
        let borderStringPre = "   " + mapHeader(sectorWidthSubsectors) + '\n';

        let sectorStringGrid = new Grid(sect.width, sect.height, function(){return " ".padStart(subsectorDisplayWidthChars, ' ')})

        var gameObjectIndex;
        for (gameObjectIndex in sect.sectorEntities)
        {
            let gameObject = sect.sectorEntities[gameObjectIndex];
            var objStr;
        
            objStr = gameObject.toString().padStart(subsectorDisplayWidthChars, ' ');

            sectorStringGrid.setValue(gameObject.subsectorX, gameObject.subsectorY, objStr);
        }

        if (!this.enterprise.components.ShortRangeSensors.fullyFunctional())
        {
            // randomly go through and corrupt the short range scan based on the health of the ship components
            for (var x in sectorStringGrid.contents)
            {   
                if (this.enterprise.components.ShortRangeSensors.isSubsectorCorrupt1D(x))
                {
                    sectorStringGrid.setValue1D(x, '?'.padStart(subsectorDisplayWidthChars, ' '));
                }
            }
        }

        let mapString = (this.typingFree && this.gridHandler) ? sectorStringGrid.toStringHyperlink() : sectorStringGrid.toStringTyping();

        return "<pre>" + borderStringPre + mapString + borderStringPost + "</pre>";

    }

    clickGridHandler(x,y)
    {
        if (this.gridHandler)
        {
            this.gridHandler(x,y);
            //this.gridHandler = null;
            this.updateGame();
            autosave(this);
        }
    }
}

function clickGridHandler(x,y)
{
    console.log("" + x + "," +y);
    game.clickGridHandler(x,y);
}

TrekGame.EntityTypes = [Star, StarBase, Klingon, Planet];
TrekGame.BaseMissionTime = 25;
TrekGame.MissionTimeSpread = 10;
TrekGame.BombardCost = 3;
TrekGame.BombardReinforcementSize = 5;

function createEntityMap(entityList)
{
    var map = new Map();
    var x;
    for (x in entityList)
    {
        let etype = entityList[x];
        map.set(etype.name, etype);
    }
    return map;
}

const EntityMap = createEntityMap(TrekGame.EntityTypes);

console.log("Hope you enjoy the game!");