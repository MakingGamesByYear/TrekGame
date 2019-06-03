class MenuOption
{
    constructor(option, separator, description, payload)
    {
        this.option = option;
        this.separator = separator;
        this.description = description;
        this.payload = payload;
    }

    compare(testString)
    {
        return testString.toLowerCase() == this.option.toLowerCase();
    }

    toString()
    {
        return this.option + this.separator + this.description + '\n';
    }
}

class Menu
{
    getSelectedOption(optionText)
    {
        for (var x in this.options)
        {
            if (this.options[x].compare(optionText))
            {
                return this.options[x];
            }
        }
        return null;
    }

    chooseOption(optionText)
    {
        var menuopt = this.getSelectedOption(optionText);
        if (menuopt)
        {
            menuopt.payload();
            return true;
        }
        return false;
    }

    toString()
    {
        var rstring = "ENTER ONE OF THE FOLLOWING:\n";

        for (var x in this.options)
        {
            rstring += this.options[x];
        }

        return rstring;
    }
}
