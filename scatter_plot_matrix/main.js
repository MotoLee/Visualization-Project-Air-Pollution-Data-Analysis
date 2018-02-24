function loadScatterPlotMatrix (data, dom_element_to_append_to, my_trait) {

    var width = 900, size = 260, padding = 20;

    var xScale = d3.scaleLinear().range([padding / 2, size - padding / 2]);
    var yScale = d3.scaleLinear().range([size - padding / 2, padding / 2]);
    var xAxis = d3.axisBottom().scale(xScale).ticks(6);
    var yAxis = d3.axisLeft().scale(yScale).ticks(6);
    // var color = d3.scaleOrdinal(d3.schemeCategory20c);
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var parseDate = d3.timeParse("%Y/%m/%d");

    var domainByTrait = {};
    var traits = ["SO2", "CO", "O3", "PM10", "PM2.5", "NOx", "NO", "NO2","AMB_TEMP", "RH", "WIND_SPEED",
      "WIND_DIREC", "WS_HR", "WD_HR"];
    var myTraits = ["SO2", my_trait, "O3"];
    var nTrait = 3;

    console.log(data);
    data.forEach(function(d) {
      for (var i = 0; i < traits.length; i++) {
        d[traits[i]] = +d[traits[i]];
      }
      d["YEAR"] = d["DATE"].getFullYear();
      d["MONTH"] = d["DATE"].getMonth()+1;
    });
    console.log(data);

    traits.forEach(function(trait) {
        domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
    });

    // Add the selector_traits_0
    var selector_traits_0 = d3.select(dom_element_to_append_to).append('select')
      .attr('class','selector_traits')
      .attr('id','selector_traits_0')
      .style("margin-left", "100px")
      .on('change',function(){
        myTraits[0] = this.value;
        d3.select("#bottom_main_div").select("svg").remove();
        updateData(data, myTraits);
      });
    var selector_traits_0_options = selector_traits_0.selectAll('option')
      .data(traits).enter()
      .append('option')
      .text(function (d) { return d; });

    console.log(selector_traits_0);

    // Add the selector_traits_1
    var selector_traits_1 = d3.select(dom_element_to_append_to).append('select')
      .attr('class','selector_traits')
      .attr('id','selector_traits_1')
      .style("margin-left", "100px")
      .on('change',function(){
        myTraits[1] = this.value;
        d3.select("#bottom_main_div").select("svg").remove();
        updateData(data, myTraits);
      });
    var selector_traits_1_options = selector_traits_1.selectAll('option')
      .data(traits).enter()
      .append('option')
      .text(function (d) { return d; });

    // Add the selector_traits_2
    var selector_traits_2 = d3.select(dom_element_to_append_to).append('select')
      .attr('class','selector_traits')
      .attr('id','selector_traits_2')
      .style("margin-left", "100px")
      .on('change',function(){
        myTraits[2] = this.value;
        d3.select("#bottom_main_div").select("svg").remove();
        updateData(data, myTraits);
      });
    var selector_traits_2_options = selector_traits_2.selectAll('option')
      .data(traits).enter()
      .append('option')
      .text(function (d) { return d; });


    updateData(data, myTraits);

    // ** Update data section (Called from the onclick)
    function updateData(data, my_traits) {

        console.log(my_traits);
      
        xAxis.tickSize(size * nTrait);
        yAxis.tickSize(-size * nTrait);

        var spm_brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend)
            .extent([[0,0],[size,size]]);

        var svg = d3.select(dom_element_to_append_to).append("svg")
            .attr("width", size * nTrait + padding)
            .attr("height", size * nTrait + padding)
            .append("g")
            .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

        svg.selectAll(".x.axis")
            .data(myTraits)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", function(d, i) { return "translate(" + (nTrait - i - 1) * size + ",0)"; })
            .each(function(d) { xScale.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

        svg.selectAll(".y.axis")
            .data(myTraits)
            .enter().append("g")
            .attr("class", "y axis")
            .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
            .each(function(d) { yScale.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

        var cell = svg.selectAll(".cell")
            .data(cross(myTraits, myTraits))
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d) { return "translate(" + (nTrait - d.i - 1) * size + "," + d.j * size + ")"; })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function(d) { return d.i === d.j; }).append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .style("font-size","18px")
            .text(function(d) { return d.x; });

        cell.call(spm_brush);


        function plot(p) {

            var cell = d3.select(this);

            xScale.domain(domainByTrait[p.x]);
            yScale.domain(domainByTrait[p.y]);

            cell.append("rect")
                .attr("class", "frame")
                .attr("x", padding / 2)
                .attr("y", padding / 2)
                .attr("width", size - padding)
                .attr("height", size - padding);

            cell.selectAll(".spm_circle")
                .data(data)
                .enter().append("circle")
                .attr("class","spm_circle")
                .attr("cx", function(d) { return xScale(d[p.x]); })
                .attr("cy", function(d) { return yScale(d[p.y]); })
                .attr("r", 4)
                .style("fill", function(d) { return color(d["YEAR"]); });
        }

        var brushCell;

        // Clear the previously-active brush, if any.
        function brushstart(p) {
          if (brushCell !== this) {
            d3.select(brushCell).call(brush.move, null);
            brushCell = this;
          x.domain(domainByTrait[p.x]);
          y.domain(domainByTrait[p.y]);
          }
        }

        // Highlight the selected circles.
        function brushmove(p) {
          var e = d3.brushSelection(this);
          svg.selectAll(".spm_circle").classed("hidden", function(d) {
            return !e
              ? false
              : (
                e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
                || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
              );
          });
        }

        // If the brush is empty, select all circles.
        function brushend() {
          var e = d3.brushSelection(this);
          console.log(e);
          if (e === null) svg.selectAll(".hidden").classed("hidden", false);
        }
    }
}

function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
}
