var svg = d3.select("svg");
var margin = { top: 20, right: 20, bottom: 110, left: 40 };
var margin2 = { top: 430, right: 20, bottom: 20, left: 40 };
var width = +svg.attr("width") - margin.left - margin.right;
var height = +svg.attr("height") - margin.top - margin.bottom;
var height2 = +svg.attr("height") - margin2.top - margin2.bottom;

const PARSE_DATE_YYYYMMDD = d3.timeParse("%Y/%m/%d");
const PARSE_DATE_YYYYMM = d3.timeParse("%Y/%m");
const dateConverterYYYYMMDD = (d) => { d.DATE = PARSE_DATE_YYYYMMDD(d.DATE); return d; }
const dateConverterYYYYMM = (d) => { d.DATE = PARSE_DATE_YYYYMM(d.DATE); return d; }

var x = d3.scaleTime().range([0, width]);
var x2 = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);
var y2 = d3.scaleLinear().range([height2, 0]);

var xAxis = d3.axisBottom(x);
var xAxis2 = d3.axisBottom(x2);
var yAxis = d3.axisLeft(y);

var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

var area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.DATE); })
    .y0(height)   // For not showing line in the bottom
    .y1(function(d) { return y(d.VALUE); });

var area2 = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x2(d.DATE); })
    .y0(height2)
    .y1(function(d) { return y2(d.VALUE); });

var line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.DATE); })
    .y(function(d) { return y(d.VALUE); });

svg.append("defs")
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

var myTrait = "PM2.5";
var maxDate;
var myStation = 0;

// Initialization
window.onload = function () {
  var day_path = "../day-avg/day_csv_station_" + STATIONS_DICTIONARY[STATIONS[myStation]] + ".csv";
  d3.csv(day_path, function(error, data) {
    if (error) throw error;

    // Add the selector_traits
    var selector_traits = d3.select('#top_right_div')
      .append('select')
      .attr('class','selector_traits')
      .style("margin", "20px")
      .on('change',function() {
        myTrait = this.value;

        // remove historical line graph
        focus.selectAll("*").remove();
        context.selectAll("*").remove();
        drawHistoricalLineChart(myTrait, "2016/01", 12, myStation);

        // remove circular heat map
        d3.select("#right_div").selectAll("*").remove();
        drawCircularHeatMap(myTrait, myStation);

        d3.select('#selector_traits_notes').text(myTrait + ' is selected.')
      });

    selector_traits.selectAll('option')
      .data(TRAITS).enter()
      .append('option')
      .text(function (d) { return d; });

    d3.select('#top_right_div')
      .append('text')
      .style("font-size", "15px")
      .style("margin", "20px")
      .attr('id', 'selector_traits_notes')
      .text(myTrait + ' is selected.');

    // Add the selector_station
    var selector_station = d3.select('#top_right_div')
      .append('select')
      .attr('class','selector_station')
      .style("margin", "20px")
      .on('change',function(){
        for (var i = 0; i < STATIONS.length; i++) {
          if(STATIONS[i] == this.value) myStation = i;
        }

        // remove historical line chart
        focus.selectAll("*").remove();
        context.selectAll("*").remove();
        drawHistoricalLineChart(myTrait, "2016/01", 12, myStation);

        // remove circular heat map
        d3.select("#right_div").selectAll("*").remove();
        drawCircularHeatMap(myTrait, myStation);

        d3.select('#selector_station_notes')
          .text(STATIONS[myStation] + '( ' + STATIONS_CHT[myStation] + ' ) is selected.')
      });

    d3.select('#top_right_div')
        .append('text')
        .style("font-size", "15px")
        .style("margin", "20px")
        .attr('id', 'selector_station_notes')
        .text(STATIONS[myStation] + ' is selected.');

    var selector_station_options = selector_station.selectAll('option')
      .data(STATIONS).enter()
      .append('option')
      .text(function (d) {return d; });

    // Main function starts here
    drawHistoricalLineChart(myTrait, "2016/01", 12, myStation);
    drawCircularHeatMap(myTrait, myStation);
  });
}

// Draw Circular Heat Map
function drawCircularHeatMap(myTrait, myStation) {
  var month_path = "../month-avg/month_csv_station_" + STATIONS_DICTIONARY[STATIONS[myStation]] + ".csv";

  d3.csv(month_path, dateConverterYYYYMM, function(error, data) {
    if (error) throw error;

    // Should be a number not string
    data.forEach(item => {
      for (var i = 0; i < TRAITS.length; i++) {
        item[TRAITS[i]] = +item[TRAITS[i]];
      }
    });

    var inputData = data.map(item => {
      return {
        "month": item.DATE.getMonth()+1,
        "year": item.DATE.getFullYear(),
        "value": item[myTrait]
      }
    });

    loadCircularHeatMap(inputData, "#right_div", YEAR_LABEL, MONTH_LABEL, myTrait, myStation);
  });
}

// Draw Historical Line Chart
function drawHistoricalLineChart(myTrait, initDate, initDateLen, myStation) {
  var day_path = "../day-avg/day_csv_station_" + STATIONS_DICTIONARY[STATIONS[myStation]] + ".csv";
  var month_path = "../month-avg/month_csv_station_" + STATIONS_DICTIONARY[STATIONS[myStation]] + ".csv";

  d3.csv(day_path, dateConverterYYYYMMDD, function(error, day_data) {
    if (error) throw error;

    dictData = [];
    dictAvg = [];
    day_data.forEach(function(d){
      d[myTrait] = +d[myTrait];
      dictData.push({"DATE": d.DATE, "VALUE": +d[myTrait]});
    });

    d3.csv(month_path, dateConverterYYYYMM, function(error, month_data) {
      if (error) throw error;

      month_data.forEach(function(d){
        d[myTrait] = +d[myTrait];
        dictAvg.push({"DATE": d.DATE, "VALUE": d[myTrait]});
      });

      maxDate = d3.max(month_data, function(d) { return d.DATE; });
      maxDateObj = dictAvg.find(o => o["DATE"] == maxDate);
      maxDateObj["DATE"] = PARSE_DATE_YYYYMMDD("" + maxDate.getFullYear() + "/" + (maxDate.getMonth() + 1) + "/31");
      dictAvg.push(maxDateObj);;

      // Setup slider
      var slider = document.getElementById("slider");
      var maxValue = 1.01 * d3.max(dictData, function(d) { return d.VALUE; });
      slider.max = maxValue.toString();
      slider.value = maxValue/2;
      slider.step = maxValue/100;
      d3.select("#slider").on("input", function() { highlight(this.value); });
      d3.select("#highlight_text").remove();

      x.domain(d3.extent(dictData, function(d) { return d.DATE; }));
      y.domain([TRAIT_RANGE[myTrait][0], Math.min(TRAIT_RANGE[myTrait][1], maxValue)]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      // gridlines in y axis function
      focus.append("g")
          .attr("class", "grid")
          .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

      focus.append("path")
          .datum(dictData)
          .attr("class", "area")
          .attr("d", area);

      focus.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      focus.append("g")
          .attr("class", "axis axis--y")
          .call(yAxis);

      focus.selectAll(".bar")
          .data(dictData)
          .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d.DATE); })
          .attr("y", function(d) { return y(d.VALUE); })
          .attr('fill', "none")
          .attr("width", 2)
          .attr("height", function(d) { return height - y(d.VALUE); })
          .on("mouseover", function(d, i) {
            svg.select("g").append("text")
              .text(d.DATE + "(" + d.VALUE + ")")
              .attr("transform", "translate(100,100)")
              .attr("x", 100)
              .attr("y", 200)
              .style("text-anchor", "middle")
              .attr("font-family", "sans-serif")
              .attr("font-size", "28px")
              .style("fill", "black");
          });

      focus.append("path")
          .datum(dictAvg)
          .attr("class", "line")
          .attr("d", line);

      context.append("path")
          .datum(dictData)
          .attr("class", "area")
          .attr("d", area2);

      context.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xAxis2);

      context.append("g")
          .attr("class", "brush")
          .call(brush)
          .call(brush.move, x.range());

      svg.append("rect")
          .attr("class", "zoom")
          .attr("width", width)
          .attr("height", height)
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
          .call(zoom);

      // Set initial zoom level
      svg.call(zoom.transform, d3.zoomIdentity.scale(month_data.length/initDateLen)
        .translate(-x(PARSE_DATE_YYYYMM(initDate)), 0));
    });
  });
}

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  focus.select(".area").attr("d", area);
  focus.select(".axis--x").call(xAxis);
  focus.selectAll(".bar").attr("x", function(d) { return x(d.DATE); });
  focus.select(".line").attr("d", line);
  svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
      .scale(width / (s[1] - s[0]))
      .translate(-s[0], 0));
}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  focus.select(".area").attr("d", area);
  focus.select(".axis--x").call(xAxis);
  focus.selectAll(".bar").attr("x", function(d) { return x(d.DATE); });
  focus.select(".line").attr("d", line);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

function highlight(newValue) {
  d3.select("#highlight_text").remove();
  d3.select("#slider_text")
    .append('text')
    .attr('id',"highlight_text")
    .style('margin', "10px")
    .text(Math.ceil(newValue*100)/100);
  focus.selectAll(".bar").attr('fill', function(d) {
    if(d.VALUE > newValue) return "red";
    else return "none";
  });
}

function resetHighlight() {
  d3.select("#highlight_text").remove();
  focus.selectAll(".bar").attr('fill', "none");
}
