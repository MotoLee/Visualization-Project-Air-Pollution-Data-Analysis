function loadCircularHeatMap (dataset, dom_element_to_append_to,radial_labels,segment_labels, my_trait, my_station) {

    var margin = {top: 10, right: 10, bottom: 10, left: 10};
    var width = 300 - margin.left - margin.right;

    var height = width;
    var innerRadius = width/14;
    var segmentHeight = (width - margin.top - margin.bottom - 2*innerRadius )/(2*radial_labels.length)

    var chart = circularHeatChart()
    .innerRadius(innerRadius)
    .segmentHeight(segmentHeight)
    .radialLabels(radial_labels)
    .segmentLabels(segment_labels);

    chart.accessor(function(d) {return d.value;})

    var svg = d3.select(dom_element_to_append_to)
    .selectAll('svg')
    .data([dataset])
    .enter()
    .append('svg')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append('g')
    .attr("transform",
        "translate(" + ( (width )/2 - (radial_labels.length*segmentHeight + innerRadius)  ) + "," + margin.top + ")")
    .call(chart);

    var tooltip = d3.select(dom_element_to_append_to)
    .append('div')
    .attr('class', 'tooltip');

    tooltip.append('div').attr('class', 'year');
    tooltip.append('div').attr('class', 'month');
    tooltip.append('div').attr('class', 'value');

    svg.selectAll("path")
    .on('mouseover', function(d) {
        tooltip.select('.month').html("<b> Month: " + d.month + "</b>");
        tooltip.select('.year').html("<b> Year: " + d.year + "</b>");
        tooltip.select('.value').html("<b> " + my_trait + ": " + (Math.round(d.value * 100)/100) + "</b>");

        tooltip.style('display', 'block');
        tooltip.style('opacity',2);
    })
    .on('mousemove', function(d) {

        tooltip.style('top', (d3.event.layerY + 10) + 'px')
        .style('left', (d3.event.layerX - 25) + 'px');
    })
    .on('mouseout', function(d) {
        tooltip.style('display', 'none');
        tooltip.style('opacity',0);
    });

    svg.selectAll("path")
    .on('click', function(d) {
        // remove historical line graph
        focus.selectAll("*").remove();
        context.selectAll("*").remove();
        drawHistoricalLineChart(my_trait, d.year+'/'+d.month, 1, my_station);
    });
}

function circularHeatChart() {
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
    innerRadius = 20,
    numSegments = 12,
    segmentHeight = 20,
    domain = null,
    range = ["white", "red"],
    accessor = function(d) {return d;},
    radialLabels = segmentLabels = [];

    function chart(selection) {
        selection.each(function(data) {
            var svg = d3.select(this);

            var offset = innerRadius + Math.ceil(data.length / numSegments) * segmentHeight;
            g = svg.append("g")
                .classed("circular-heat", true)
                .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

            var autoDomain = false;
            if (domain === null) {
                domain = d3.extent(data, accessor);
                autoDomain = true;
            }

            var color = d3.scaleQuantize().domain(domain)
                .range(["#ffffff","#ADDFFF","#56A5EC","#0041C2","#151b54"]);


            if(autoDomain)
                domain = null;

            g.selectAll("path").data(data)
                .enter().append("path")
                .attr("d", d3.arc().innerRadius(ir).outerRadius(or).startAngle(sa).endAngle(ea))
                .attr("stroke", function(d) {return "#4f5b69";})
                .attr("fill", function(d) {return color(accessor(d));});

            // Unique id so that the text path defs are unique - is there a better way to do this?
            var id = d3.selectAll(".circular-heat")._groups[0].length;

            //Radial labels
            var lsa = 0.01; //Label start angle
            var labels = svg.append("g")
                .classed("labels", true)
                .classed("radial", true)
                .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

            labels.selectAll("def")
                .data(radialLabels).enter()
                .append("def")
                .append("path")
                .attr("id", function(d, i) {return "radial-label-path-"+id+"-"+i;})
                .attr("d", function(d, i) {
                    var r = innerRadius + ((i + 0.2) * segmentHeight);
                    return "m" + r * Math.sin(lsa) + " -" + r * Math.cos(lsa) +
                            " a" + r + " " + r + " 0 1 1 -1 0";
                });

            labels.selectAll("text")
                .data(radialLabels).enter()
                .append("text")
                .append("textPath")
                .attr("xlink:href", function(d, i) {return "#radial-label-path-"+id+"-"+i;})
                .style("font-size", "12px")
                .style("font-family", "arial")
                .text(function(d) {return d;});

            //Segment labels
            var segmentLabelOffset = 2;
            var r = innerRadius + Math.ceil(data.length / numSegments) * segmentHeight + segmentLabelOffset;
            labels = svg.append("g")
                .classed("labels", true)
                .classed("segment", true)
                .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

            labels.append("def")
                .append("path")
                .attr("id", "segment-label-path-"+id)
                .attr("d", "m0 -" + r + " a" + r + " " + r + " 0 1 1 -1 0");

            labels.selectAll("text")
                .data(segmentLabels).enter()
                .append("text")
                .append("textPath")
                .attr("xlink:href", "#segment-label-path-"+id)
                .style("font-size", "13px")
                .style("font-family", "arial")
                .attr("startOffset", function(d, i) {return i * 100 / numSegments + "%";})
                .text(function(d) {return d;});

            var legend = d3.select("svg").selectAll(".legend")
                .data(["#ffffff","#ADDFFF","#56A5EC","#0041C2","#151b54"])
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + (i * 20 + 10) + ")"; });

            // draw legend colored rectangles
            legend.append("rect")
                .attr("x", width-40)
                .attr("y", 10)
                .attr("width", 16)
                .attr("height", 16)
                .attr("style", "outline: thin solid black;")
                .style("fill", function(d){ return d; });

            // draw legend text
            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".4em")
                .style("text-anchor", "end")
                .style("font-size","12px")
                .text(function(d) { return "group " + d;})

        });

    }

    /* Arc functions */
    ir = function(d, i) {
        return innerRadius + Math.floor(i/numSegments) * segmentHeight;
    }
    or = function(d, i) {
        return innerRadius + segmentHeight + Math.floor(i/numSegments) * segmentHeight;
    }
    sa = function(d, i) {
        return (i * 2 * Math.PI) / numSegments;
    }
    ea = function(d, i) {
        return ((i + 1) * 2 * Math.PI) / numSegments;
    }

    /* Configuration getters/setters */
    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.innerRadius = function(_) {
        if (!arguments.length) return innerRadius;
        innerRadius = _;
        return chart;
    };

    chart.numSegments = function(_) {
        if (!arguments.length) return numSegments;
        numSegments = _;
        return chart;
    };

    chart.segmentHeight = function(_) {
        if (!arguments.length) return segmentHeight;
        segmentHeight = _;
        return chart;
    };

    chart.domain = function(_) {
        if (!arguments.length) return domain;
        domain = _;
        return chart;
    };

    chart.range = function(_) {
        if (!arguments.length) return range;
        range = _;
        return chart;
    };

    chart.radialLabels = function(_) {
        if (!arguments.length) return radialLabels;
        if (_ == null) _ = [];
        radialLabels = _;
        return chart;
    };

    chart.segmentLabels = function(_) {
        if (!arguments.length) return segmentLabels;
        if (_ == null) _ = [];
        segmentLabels = _;
        return chart;
    };

    chart.accessor = function(_) {
        if (!arguments.length) return accessor;
        accessor = _;
        return chart;
    };

    return chart;
}
