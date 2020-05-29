// quantitative colour scale
var green_to_blue = d3.scale.quantile().domain([1, 12])
    .range(["firebrick","green","darkorange","blue"]);

var color = function(data) { return green_to_blue(data['MONTH']); };

var myStationIndex = 0;

var parseDate1 = d3.time.format("%Y/%m/%d"),
    parseDate2 = d3.time.format("%Y/%m");

var myTraits = ["SO2", "CO", "O3", "PM10"];

var all_data = [];

// Initialization
window.onload = function () {

    var selector_station = d3.select("#station_selectors")
        .append('select')
        .attr('class','selector_station')
        .on('change',function(){
            for (let i = 0; i < STATIONS.length; i++) {
                if(STATIONS[i] == this.value) myStationIndex = i;
            }
            selector_station_notes.text(STATIONS_CHT[myStationIndex]);
            d3.select("#parallel-coordinate").selectAll("*").remove();
            CreateParallelCoordinate(myTraits, myStationIndex);
        });

    var selector_station_notes = d3.select('#station_selectors')
        .append('text')
        .style("font-size", "13px")
        .style("margin", "10px")
        .attr('id', 'selector_station_notes')
        .text(STATIONS_CHT[myStationIndex]);

    var selector_station_options = selector_station.selectAll('option')
        .data(STATIONS)
        .enter()
        .append('option')
        .text(function (d) {return d; });

    for (let i = 0; i < 4; i++) {
        d3.select("#trait_selectors")
            .append('select')
            .attr('id','selector_traits_' + i)
            .style("margin", "10px")
            .text("Trait " + i )
            .on('change',function() {
                myTraits[i] = this.value;
                d3.select("#parallel-coordinate").selectAll("*").remove();
                DrawParallelCoordinate(myTraits, myStationIndex, false);
            });
    }

    // load csv file and create the chart
    CreateParallelCoordinate(myTraits, myStationIndex);
};

function CreateParallelCoordinate(myTraits, myStationIndex) {

    var month_path = "../month-avg/month_csv_station_" + STATIONS_DICTIONARY[STATIONS[myStationIndex]] + ".csv";

    d3.csv(month_path, function(data) {

        // Data pre-processing
        for (let i = 0; i < data.length; i++) {
            all_data.push({
                "YEAR": parseDate2.parse(data[i]["DATE"]).getFullYear(),
                "MONTH": (parseDate2.parse(data[i]["DATE"]).getMonth()+1)
            });
            TRAITS.forEach(trait => {
                all_data[i][trait] = Math.round(data[i][trait] * 1000) / 1000;
            });
        }

        DrawParallelCoordinate(myTraits, myStationIndex);
    });

}

function DrawParallelCoordinate(myTraits, myStationIndex) {

    var parcoords = d3.parcoords()("#parallel-coordinate").color(color).alpha(0.5);

   // Data pro-processing
    input_data = [];
    for (let i = 0; i < all_data.length; i++) {
        input_data.push({
            "YEAR": all_data[i]["YEAR"],
            "MONTH": all_data[i]["MONTH"]
        });
        input_data[i][myTraits[0]] = all_data[i][myTraits[0]];
        input_data[i][myTraits[1]] = all_data[i][myTraits[1]];
        input_data[i][myTraits[2]] = all_data[i][myTraits[2]];
        input_data[i][myTraits[3]] = all_data[i][myTraits[3]];
    }

    // Main
    parcoords.data(input_data).render().brushMode("1D-axes");  // enable brushing

    // create data table, row hover highlighting
    var grid = d3.divgrid();

    d3.select("#grid")
        .datum(input_data.slice(0, 12))
        .call(grid)
        .selectAll(".row")
        .on({
            "mouseover": function(d) { parcoords.highlight([d]) },
            "mouseout": parcoords.unhighlight
        });

    // update data table on brush event
    parcoords.on("brush", function(d) {
        d3.select("#grid")
            .datum(d.slice(0, 10))
            .call(grid)
            .selectAll(".row")
            .on({
              "mouseover": function(d) { parcoords.highlight([d]) },
              "mouseout": parcoords.unhighlight
        });
    });

    // Update trait selector options
    for (let i = 0; i < 4; i++) {
        d3.select("#selector_traits_" + i).selectAll("*").remove();
        for(let j = 0; j < TRAITS.length; j++) {
            if(TRAITS[j] === myTraits[i]) {
                d3.select("#selector_traits_" + i)
                    .append('option')
                    .attr('selected', 'selected')
                    .text(TRAITS[j]);
            }
            else if(!myTraits.includes(TRAITS[j])) {
                d3.select("#selector_traits_" + i)
                    .append('option')
                    .text(TRAITS[j]);
            }
        }
    }
}