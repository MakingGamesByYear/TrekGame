class TrekGame
{
    static ConstructFromJSData(jsData)
    {
        try
        {
            let gamerval = Object.create(TrekGame.prototype);
            Object.assign(gamerval, jsData);

            gamerval.enterprise = Object.create(Enterprise.prototype);
            Object.assign(gamerval.enterprise, jsData.enterprise);

            gamerval.enterprise.sensorHistory = new SensorHistory();// Object.create(SensorHistory);
            Object.assign(gamerval.enterprise.sensorHistory, jsData.enterprise.sensorHistory);

            gamerval.galaxyMap = GalaxyMap.ConstructFromJSData(jsData.galaxyMap);

            // console.log("galaxy map : " + gamerval.galaxyMap);

            gamerval.currentQuadrant = gamerval.galaxyMap.lookup(gamerval.enterprise.quadrantX, gamerval.enterprise.quadrantY);

            gamerval.currentQuadrant.addEntity(gamerval.enterprise);

            gamerval.createMenus();

            gamerval.checkStarbaseDock();

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
            console.log("Corrupt save file.  Erasing.");
            autosave(null);
            gameOutputAppend("Corrupt save file.  Refresh page to start new game.");
        }
    }

    constructor()
    {
        this.primeUniverse = true;

        if (!this.primeUniverse)
        {
            TrekGame.EntityTypes.push(Planet);
        }

        this.gameOver = false;

        this.galaxyMap = new GalaxyMap(mapWidthQuadrants, mapHeightQuadrants, TrekGame.EntityTypes);
        
        this.enterprise = new Enterprise();

        // start in a random quadrant
        this.enterprise.quadrantX = randomInt(0, mapWidthQuadrants - 1);
        this.enterprise.quadrantY = randomInt(0, mapHeightQuadrants - 1);
        this.enterprise.sectorX = 0;
        this.enterprise.sectorY = 0;
        
        this.currentQuadrant = this.galaxyMap.lookup(this.enterprise.quadrantX, this.enterprise.quadrantY);

        this.currentQuadrant.addEntityInFreeSector(this.enterprise);

        // pick a stardate between the start and end of TOS
        this.starDate = randomInt(1312, 5928);
        this.starDateBegin = this.starDate;
        this.endStarDate = this.starDate + TrekGame.BaseMissionTime + randomInt(0, TrekGame.MissionTimeSpread);

        this.currentQuadrantScanned = false;

        this.createMenus();
        this.setInputPrompt(this.mainMenu.toString());

        this.updateGame();

        this.printStory();

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
                starbase.quadrantX-1, 
                starbase.quadrantY-1, 
                starbase.quadrantX+1, 
                starbase.quadrantY+1
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
        gameOutputAppend("Klingon Fighter Destroyed");
        this.currentQuadrant.removeEntity(k);
        Klingon.Instances--;
        Klingon.InstancesDestroyed++;
    }

    printStory()
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

        storyString += 
        "\n\nThere are " + StarBase.Instances + " Federation Starbases in the region for refueling, restocking torpedoes, and repairs.";

        storyString += "\n\nCheck the ship's computer to access the captain's manual for a tutorial on how to complete your mission.";

        storyString += "\n\nGood luck, galactic peace is in your hands!";

        gameOutputAppend(storyString);
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
                    tutorialString += "Your mission takes place in a region of the galaxy that is " + mapWidthQuadrants + " by " + mapHeightQuadrants + " sectors.";
                    tutorialString += "  A galactic sector is about 2 light years across.";

                    tutorialString += "\n\nThe sector map is made up of a grid of subsectors.  The X,Y coordinates of the subsectors are displayed across the horizontal and vertical axes of the map.  The key symbols corresponding to different objects occupying a subsector are listed below.";

                    tutorialString += "\n\nTo the right of the map screen are important stats about your mission, your ship's status, and your ship's location. ";

                    tutorialString += "\n\nBelow the map screen are important status flags, such as whether the shields are too low or whether we're at red alert when enemies are present. ";

                    tutorialString += "\n\nMap key :\n" +
                    "<*> : ENTERPRISE\n*  : STAR\n+K+ : KLINGON\n>!< : STARBASE\n";

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
                    tutorialString += "\n\nThe klingons map shows the number of enemies in each sector based on your previous long range scans.  Starbases also do a continous long range scan and update your map.  Uncharted sectors display a question mark.";
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

    changeToQuadrant(qX, qY)
    {
        this.currentQuadrantScanned = false;

        this.currentQuadrant.removeEntity(this.enterprise);
        this.currentQuadrant = this.galaxyMap.lookup(qX, qY);
        this.currentQuadrant.addEntityInFreeSector(this.enterprise);

        gameOutputAppend("\nEntering galactic sector " + this.enterprise.quadrantString());
    }

    statusString()
    {
        return "<pre>" +
        "\n\n\n" + 
        "STARDATES REMAINING   " + (this.endStarDate - this.starDate) +"\n" +
        "SECTOR (X,Y)          " + (this.enterprise.quadrantX+1) +  ',' + (this.enterprise.quadrantY+1) + '\n' + 
        "SUBSECTOR (X,Y)       " + (this.enterprise.sectorX+1) +  ',' + (this.enterprise.sectorY+1) + "\n" + 
        "PHOTON TORPEDOES      " + this.enterprise.torpedoes + '\n' + 
        "SHIELD ENERGY         " + this.enterprise.shields + '\n' + 
        "FREE ENERGY           " + this.enterprise.freeEnergy + '\n' + 
        "KLINGONS REMAINING    " + Klingon.Instances + '\n' + 
        "STARBASES REMAINING   " + StarBase.Instances + '\n' +
        "</pre>";
    }

    setInputPrompt(newprompt)
    {
        document.getElementById("inputPrompt").innerHTML = newprompt;

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
        let promptstringX = "Enter destination subsector X coordinate.  Enter a value between 1 and " + quadrantWidthSectors;
        let promptstringY = "Enter destination subsector Y coordinate.  Enter a value between 1 and " + quadrantHeightSectors;

        let trekgame = this;

        let yhandler = function(inputline, subsectorX)
        {
            let subsectorY = parseInt(inputline) - 1;

            if ((subsectorY == null) || isNaN(subsectorY) || subsectorY < 0 || subsectorY >= quadrantHeightSectors)
            {
                gameOutputAppend("Invalid value!");
                return false;
            }

            return finalHandler(game, subsectorX, subsectorY);
        };

        let xhandler = function(inputline)
        {
            let subsectorX = parseInt(inputline) - 1;

            if ((subsectorX == null) || isNaN(subsectorX) || subsectorX < 0 || subsectorX >= quadrantWidthSectors)
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
        let quadrantX = parseInt(inputline) - 1;

        if ((quadrantX == null) || isNaN(quadrantX) || quadrantX < 0 || quadrantX >= mapWidthQuadrants)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.awaitInput(
            "Enter destination sector Y coordinate.  Enter a value between 1 and " + mapHeightQuadrants,
            2, 
            
            function(inputline)
            {
                return this.navigationHandlerLongRangeY(inputline, quadrantX);
            }
        );
        
        return false;
    }

    navigationHandlerLongRangeY(inputline, quadrantX)
    {
        let quadrantY = parseInt(inputline) - 1;

        if ((quadrantY == null) || isNaN(quadrantY) || quadrantY < 0 || quadrantY >= mapHeightQuadrants)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        let xd = quadrantX - this.enterprise.quadrantX;
        let yd = quadrantY - this.enterprise.quadrantY;
        let travelDistance = Math.sqrt(xd*xd + yd*yd);  // assumes single stardate.  so distance and speed have the same scalar value.

        let maxSpeed = this.enterprise.components.WarpEngines.maxSpeed();

        if (!this.enterprise.components.WarpEngines.fullyFunctional())
        {
            xd /= travelDistance;
            yd /= travelDistance;

            xd *= maxSpeed;
            yd *= maxSpeed;
            
            travelDistance = Math.sqrt(xd*xd + yd*yd);

            quadrantX = Math.floor(this.enterprise.quadrantX + xd);
            quadrantY = Math.floor(this.enterprise.quadrantY + yd);

            gameOutputAppend("Unable to make it to the destination warp target in a single jump due to damage.  New destination is Sector " + (quadrantX+1) + ", " + (quadrantY+1));
        }

        let jumpEnergyRequired = Math.floor(Enterprise.EnergyCostPerQuadrant * travelDistance);

        if (this.enterprise.freeEnergy < jumpEnergyRequired)
        {
            gameOutputAppend("Insufficient energy for long range jump, captain.  Jump requires " + jumpEnergyRequired + " free energy.");
            return true;
        }

        let trekgame = this;
        let confirmMenu = new Menu();
        confirmMenu.options.push
        (
            new MenuOption
            (
                "1", 
                ") ", 
                "CONFIRM JUMP TO SECTOR " + (quadrantX+1) + ", " + (quadrantY+1) + ".\nTRIP TAKES 1 STARDATE, " + jumpEnergyRequired + " ENERGY\n",
                function()
                {
                    trekgame.enterprise.freeEnergy -= jumpEnergyRequired;
                    trekgame.changeToQuadrant(quadrantX, quadrantY);
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
                    return true;
                }
            )
        );

        this.awaitInput(confirmMenu.toString(), 1, function(inputline){return confirmMenu.chooseOption(inputline);});
    }

    shortRangeNavigationHandler(trekgame, subsectorX, subsectorY)
    {
        let sectorsToTravel = trekgame.enterprise.distanceToSectorLoc(subsectorX, subsectorY);

        let confirmFunc = function()
        {
            if (trekgame.enterprise.warp(subsectorX, subsectorY, sectorsToTravel, trekgame))
            {
                gameOutputAppend("\nComing out of warp in sector " + trekgame.enterprise.quadrantString());
                trekgame.advanceStardate(1.0);
            }

            return true;
        }

        let jumpEnergyRequired = Math.round(trekgame.enterprise.warpEnergyCost(sectorsToTravel));

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

        let enemylist = this.currentQuadrant.getEntitiesOfType(Klingon);

        if (!enemylist.length)
        {
            gameOutputAppend("\nNo enemies in this sector to scan, captain!");
            return;
        }

        this.enterprise.freeEnergy -= Enterprise.EnemyScanCost;
        this.currentQuadrantScanned = true;

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
                gameOutputAppend("\nEnemy in subsector (" + k.sectorString() + ")");
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
        gameOutputAppend(this.enterprise.lrsString(this.galaxyMap));

        var sh = this.enterprise.sensorHistory;
        sh.updateSensorHistoryForEntityTypes
        (
            [Star, Klingon], 
            this.galaxyMap, 
            this.enterprise.quadrantX-1, 
            this.enterprise.quadrantY-1, 
            this.enterprise.quadrantX+1, 
            this.enterprise.quadrantY+1
        );

        this.advanceStardate(1.0);
    }

    manualTorpedoHandler()
    {
        let tfunc = function(trekgame, x, y){
            let gobj = new GameObject();
            gobj.sectorX = x;
            gobj.sectorY = y;
            trekgame.torpedoHandler(gobj)
            return true;
        };

        this.getSubsectorMenu(tfunc);
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

        return true;
    }

    combatStep()
    {
        this.currentQuadrant.klingonsFire(this.enterprise, this);
        this.enterprise.components.ShortRangeSensors.generateCorruptGrid();
    }

    updateStatus()
    {
        document.getElementById("status").innerHTML = this.statusString();
    }

    awaitInput(inputPrompt, charactersToRead=3, inputHandler=null)
    {
        document.getElementById("inputPrompt").style.display="Block";
        document.getElementById("gameInput").style.display="Block";
        document.getElementById("inputButton").style.display ="Block";

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
        this.updateStatus();
        updateMap(this.updateMapScreen());
        updateMapHeader("SECTOR : " + this.enterprise.quadrantString());
        updateMapFooter(this.updateStatusFlags());
    }

    checkStarbaseDock()
    {
        if (this.enterprise.dockStarbase)
        {
            console.log("already docked.");
            return;
        }

        this.mainMenu.dockOption.enabled = false;

        let starbases = this.currentQuadrant.getEntitiesOfType(StarBase);

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

    updateGame()
    {
        this.updateDisplay();
        this.starbasesScan();
        this.enterpriseShortRangeScan();
        this.checkStarbaseDock();

        this.checkEndConditions();
    }

    enterpriseShortRangeScan()
    {
        this.enterprise.sensorHistory.updateSensorHistoryForEntityTypes
            (
                [Star, Klingon], 
                this.galaxyMap, 
                this.enterprise.quadrantX, 
                this.enterprise.quadrantY, 
                this.enterprise.quadrantX, 
                this.enterprise.quadrantY
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
            gameOutputAppend("You were unable to complete your mission in time.");
            gameOutputAppend("The Klingons were able to execute their plan to destroy the Federation starbases!");
            gameOutputAppend("You'll be demoted for sure!");

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
            gameOutputAppend("All the Federation starbases have been destroyed!");
            gameOutputAppend("You've failed in your mission.  The Federation is doomed.");

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));

            this.endGame();
        }
        else if (!Klingon.Instances)
        {
            gameOutputAppend("\n\n============================YOU WIN!!============================\n");
            gameOutputAppend("You've managed to destroy all the enemy vessels, preventing the enemy from executing their plan!");
            gameOutputAppend("You're sure to get a promotion!");
            gameOutputAppend("Congratulations on your victory!");

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

        if (this.currentQuadrant.countEntitiesOfType(Klingon))
        {
            flags.push("RED ALERT");

            if (this.enterprise.isShieldLevelCritical(this.currentQuadrant.getEntitiesOfType(Klingon)))
            {
                flags.push("SHIELDS CRITICAL");
            }
        }
        else
        {
            flags.push("SECTOR CLEAR");
        }

        return flags.join(" | ");
    }

    updateMapScreen()
    {
        let quad = this.currentQuadrant;

        let borderStringPost = "   " + mapFooter(quadrantWidthSectors);
        let borderStringPre = "   " + mapHeader(quadrantWidthSectors) + '\n';

        let quadrantStringGrid = new Grid(quad.width, quad.height, function(){return " ".padStart(sectorDisplayWidthChars, ' ')})

        var gameObjectIndex;
        for (gameObjectIndex in quad.quadrantEntities)
        {
            let gameObject = quad.quadrantEntities[gameObjectIndex];
            var objStr;
        
            objStr = gameObject.toString().padStart(sectorDisplayWidthChars, ' ');

            quadrantStringGrid.setValue(gameObject.sectorX, gameObject.sectorY, objStr);
        }

        if (!this.enterprise.components.ShortRangeSensors.fullyFunctional())
        {
            // randomly go through and corrupt the short range scan based on the health of the ship components
            for (var x in quadrantStringGrid.contents)
            {   
                if (this.enterprise.components.ShortRangeSensors.isSectorCorrupt1D(x))
                {
                    quadrantStringGrid.setValue1D(x, '?'.padStart(sectorDisplayWidthChars, ' '));
                }
            }
        }

        let mapString = quadrantStringGrid.toString();

        return "<pre>" + borderStringPre + mapString + borderStringPost + "</pre>";

    }
}

TrekGame.EntityTypes = [Star, StarBase, Klingon];
TrekGame.BaseMissionTime = 25;
TrekGame.MissionTimeSpread = 10;

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