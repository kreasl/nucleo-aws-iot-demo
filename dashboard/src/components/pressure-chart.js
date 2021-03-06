import React from 'react'
import d3 from 'd3'
import _ from 'lodash'

import ChartParams from './humidity-chart-params'

import './temperature-chart.scss'

const PressureChart = React.createClass({

	getInitialState: function() {
		return {
			chartParams: {
				chartType: 'area',
				showWeatherFor: []
			}
		}
	},

	prepareData: function(data) {

		return _(data)
				.map(function(item) {

					return {
						pressure: item.pressure,
						date: new Date(item.timestamp * 1000),
						marker: item.marker
					}
				})
				.value()
	},

	initChart: function(el) {

		if (!el) return

		var that = this

		var margin, margin2, width,	height, height2

		var focusData

		var x = d3.time.scale(),
			x2 = d3.time.scale(),
			y = d3.scale.linear(),
			y2 = d3.scale.linear()

		var xAxis = d3.svg.axis().orient('bottom'),
			xAxis2 = d3.svg.axis().orient('bottom'),
			yAxis = d3.svg.axis().orient('right')

		var brush = d3.svg.brush()
			.clamp(true)
			.on('brushend', function() { that.updateChart() })

		var area2 = d3.svg.area()
			.interpolate('linear')
			.x(function(d) { return x2(d.date) })
			.y1(function(d) { return y2(d.pressure) })

		var svg = d3.select(el).append('svg')

		var rect = svg.append('defs').append('clipPath')
				.attr('id', 'clip')
			.append('rect')

		var focus = svg.append('g')
			.attr('class', 'focus')
			
			.on('mousemove', function() {

				var xPos = d3.mouse(el)[0] - margin.left

				if (xPos < 0) return

				var datePos = x.invert(xPos)

				var i = d3.bisector(function(d) { return d.date }).right(focusData, datePos)

				if (i == focusData.length
					|| (i > 0 && datePos - focusData[i-1].date < focusData[i].date - datePos))
						i--

				var d = focusData[i]

				xPos = x(d.date)

				focusCursor
					.attr('x1', xPos)
					.attr('x2', xPos)
					.style('visibility', 'visible')

				focusCursorPoint
					.attr('cx', xPos)
					.attr('cy', y(d.pressure))
					.style('visibility', 'visible')

				markerTooltip
					.text(Math.round(d.pressure * 100) / 100 + " hPa @ "
						+ d3.time.format('%X')(d.date))
					.style('top', y(d.pressure) - 25 + 'px')
					.style('display', 'block')
					.attr('class', 'cursor-tooltip' + (d.marker ? ' marker' : ''))

				var rectBBox = focusBg.node().getBBox()

				if (xPos - rectBBox.width < - 200)
					markerTooltip
						.style('left', xPos + margin.left + 5 + 'px')
						.style('right', 'initial')
				else
					markerTooltip
						.style('right', rectBBox.width - xPos + margin.right + 5 + 'px')
						.style('left', 'initial')

			})
			.on('mouseout', function() {
				markerTooltip.style('display', 'none')
				focusCursor.style('visibility', 'hidden')
				focusCursorPoint.style('visibility', 'hidden')
			})
			.on('wheel', function() {
				if (brush.empty())
					brush.extent(x.domain())

				var brushFrom = brush.extent()[0].getTime()
				var brushTo = brush.extent()[1].getTime()
				var brushSize = brushTo - brushFrom

				var contextFrom = x2.domain()[0].getTime()
				var contextTo = x2.domain()[1].getTime()

				var multiplier = d3.event.deltaY === undefined ? d3.event.wheelDeltaY : d3.event.deltaY
				multiplier = multiplier > 0 ? 1.5 : .67

				brushSize = Math.min(brushSize * multiplier, contextTo - contextFrom)
				brushSize = Math.max(brushSize, 60000)

				var brushCenter = (brushTo - brushFrom) / 2 + brushFrom
				brushCenter = Math.min(brushCenter, contextTo - brushSize / 2)
				brushCenter = Math.max(contextFrom + brushSize / 2, brushCenter)

				brush.extent([new Date(brushCenter - brushSize / 2), new Date(brushCenter + brushSize / 2)])
				brush(context.select('.brush'))

				that.updateChart()
			})

		var focusBg = focus.append('rect')
			.attr('class', 'focus-bg')
			.attr('x', 0)
			.attr('y', 0)

		var context = svg.append('g')
			.attr('class', 'context')

		var focusPath = focus.append('path')

		var focusWeatherPaths = {}
		var cityLabels = {}

		var cityColors = {}
		cityColors[625144] = '#A04942'
		cityColors[5128638] = '#E66390'
		cityColors[5368361] = '#B61ED0'
		cityColors[5809844] = '#6523DA'
		cityColors[4887398] = '#3F51B5'
		cityColors[4140963] = '#2A4458'
		cityColors[4164138] = '#2E6B65'
		cityColors[5391959] = '#46C54B'
		cityColors[2643743] = '#8BC34A'
		cityColors[3117735] = '#AEBB2C'
		cityColors[3173435] = '#ABA14E'
		cityColors[3169070] = '#AF9443'
		cityColors[2950158] = '#B78B49'
		cityColors[3067696] = '#A9482A'
		cityColors[2988507] = '#795548'
		cityColors[524901] = '#909090'

		_.forEach(this.props.weatherData, function(d) {

			focusWeatherPaths[d.cityId] = focus.append('path')
				.attr('class', 'line weather city-' + d.cityId)
				.style('stroke', cityColors[d.cityId])

			cityLabels[d.cityId] = d3.select(el).append('div')
				.attr('class', 'city-label city-' + d.cityId)
				.text(d.cityName)
				.style('background-color', cityColors[d.cityId])
		})

		var focusCursorPoint = focus.append('circle')
			.attr('class', 'cursor-point')
			.attr('r', 5)

		var focusMarkersG = focus.append('g')
			.attr('class', 'markers')

		var markerTooltip = d3.select(el).append('div')
			.attr('class', 'tooltip')

		var focusCursor = focus.append('line')
			.attr('class', 'focus-cursor')
			.attr('y1', 0)

		var focusXAxis = focus.append('g')
			.attr('class', 'x axis')

		var focusYAxis = focus.append('g')
			.attr('class', 'y axis')

		var contextPath = context.append('path')
			.attr('class', 'area')

		var contextMarkersG = context.append('g')
			.attr('class', 'context-markers')

		var contextXAxis = context.append('g')
			.attr('class', 'x axis')

		var contextG = context.append('g')
			.attr('class', 'x brush')


		var setDimensions

		(setDimensions = function() {

			var container = el.getBoundingClientRect()

			margin = {top: 10, right: 10, bottom: 100, left: 0}
			margin2 = {top: container.height - 70, right: 10, bottom: 20, left: 0}
			width = container.width - margin.left - margin.right
			height = container.height - margin.top - margin.bottom
			height2 = container.height - margin2.top - margin2.bottom

			x.range([0, width])
			x2.range([0, width])
			y.range([height, 0])
			y2.range([height2, 0])

			xAxis.scale(x)
			xAxis2.scale(x2)

			yAxis
				.scale(y)
				.tickSize(width)
				.tickFormat(function(v) {
					return y.tickFormat()(v) + ' hPa'
				})

			brush.x(x2)

			area2.y0(height2)

			svg
				.attr('width', width + margin.left + margin.right)
				.attr('height', height + margin.top + margin.bottom)

			rect
				.attr('width', width)
				.attr('height', height)

			focus.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
			focusCursor.attr('y2', height)
			focusBg.attr('width', width)
				.attr('height', height)
			context.attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')')
			focusXAxis.attr('transform', 'translate(0,' + height + ')')
			contextXAxis.attr('transform', 'translate(0,' + height2 + ')')
			
			contextG.call(brush)
				.selectAll('rect')
					.attr('y', -6)
					.attr('height', height2 + 7)
		})()

		d3.select(window).on('resize', function() {
			setDimensions()
			that.updateChart()
		})


		this.updateChart = function() {

			var data = this.prepareData(this.props.data)

			var weatherData = _.map(this.props.weatherData, function(d) {

				var res = {
					cityId: d.cityId,
					pressureData: that.prepareData(d.pressureData)
				}

				if (res.pressureData.length)
					res.pressureData.push({
						pressure: _.last(res.pressureData).pressure,
						date: _.last(data).date
					})

				return res
			})

			var xDomain = d3.extent(data.map(function(d) { return d.date }))

			if (brush.empty()) {
				x.domain([xDomain[1] - 300000, xDomain[1]])
			} else x.domain(brush.extent())

			var bisector = d3.bisector(function(d) { return d.date }).right

			focusData = data.slice(
				Math.max(0, bisector(data, x.domain()[0]) - 1),
				Math.min(data.length, bisector(data, x.domain()[1]) + 1)
			)

			var focusWeatherData = _.map(weatherData, function(d) {
				var res = {
					cityId: d.cityId,
					pressureData: d.pressureData.slice(
							Math.max(0, bisector(d.pressureData, x.domain()[0]) - 1),
							Math.min(d.pressureData.length, bisector(d.pressureData, x.domain()[1]) + 1)
						)
					}

				if (res.pressureData.length > 1) {

					var last = res.pressureData[res.pressureData.length - 1]
					var last1 = res.pressureData[res.pressureData.length - 2]
					var dpressure = last.pressure - last1.pressure
					var dTime = last.date - last1.date
					var dxDomainTime = x.domain()[1] - last1.date

					last.date = x.domain()[1]
					last.pressure = last1.pressure + (dxDomainTime * dpressure / dTime)
				}

				return res
			})

			var dataUnion = _(focusWeatherData)
					.map(function(d) {
							return _.includes(that.state.chartParams.showWeatherFor, d.cityId) ? d.pressureData : []
						})
					.push(focusData)
					.flatten()
					.value()

			y.domain([
					Math.floor((d3.min(dataUnion.map(function(d) { return d.pressure })) - .3) * 30) / 30,
					Math.ceil((d3.max(dataUnion.map(function(d) { return d.pressure })) + .3) * 30) / 30
				])

			x2.domain(xDomain)
			y2.domain([
					Math.floor(d3.min(data.map(function(d) { return d.pressure })) - .5),
					Math.ceil(d3.max(data.map(function(d) { return d.pressure })))
				])

			var focusPathGenerator = (this.state.chartParams.chartType == 'area'
				? d3.svg.area()
					.y0(height)
					.y1(function(d) { return y(d.pressure) })
				: d3.svg.line()
					.y(function(d) { return y(d.pressure) })
				)
					.interpolate('monotone')
					.x(function(d) { return x(d.date) })

			focusPath
				.datum(data)
				.attr('d', focusPathGenerator)
				.attr('class', this.state.chartParams.chartType == 'area' ? 'area' : 'line')
			contextPath.datum(data).attr('d', area2)
			focusXAxis.call(xAxis)

			focusYAxis
				.call(yAxis)
				.selectAll('text')
					.attr('x', 4)
					.attr('dy', -4)

			contextXAxis.call(xAxis2)

			_.forEach(focusWeatherData, function(d) {

				focusWeatherPaths[d.cityId]
					.datum(d.pressureData)
					.attr('d',
						d3.svg.line()
							.x(function(d) { return x(d.date) })
							.y(function(d) { return y(d.pressure) })
							.interpolate('basis')
						)
					.attr('visibility',
						_.includes(that.state.chartParams.showWeatherFor, d.cityId) ? 'visible' : 'hidden')

				if (d.pressureData.length)
					cityLabels[d.cityId]
						.style('display',
							_.includes(that.state.chartParams.showWeatherFor, d.cityId) ? 'block' : 'none')
						.style('top', y(_.last(d.pressureData).pressure) + 'px')
			})

			if (!brush.empty())
				brush.extent(x.domain())(context.select('.brush'))

			var markersData = _.filter(data, function(d) {
				return d.marker
			})

			var focusMarkersData = _.filter(markersData, function(d) {
				return d.date >= x.domain()[0] && d.date <= x.domain()[1]
			})

			var markers = focusMarkersG.selectAll('circle')
				.data(focusMarkersData)

			markers.enter().append('circle')
				.attr('class', 'marker')
				.attr('r', 5)

			markers
				.attr('cx', function(d) { return x(d.date) })
				.attr('cy', function(d) { return y(d.pressure) })

			markers.exit().remove()

			var contextMarkers = contextMarkersG.selectAll('line')
				.data(markersData)

			contextMarkers.enter().append('line')
				.attr('class', 'context-marker')

			contextMarkers
				.attr('x1', function(d) { return x2(d.date) })
				.attr('y1', height2)
				.attr('x2', function(d) { return x2(d.date) })
				.attr('y2', function(d) { return Math.round(y2(d.pressure)) })

			contextMarkers.exit().remove()
		}

		this.updateChart()
	},

	componentDidUpdate: function(prevProps) { this.updateChart() },

	setChartParam: function(paramName, value) {

		this.state.chartParams[paramName] = value

		this.setState({
			chartParams: this.state.chartParams
		})
	},

	render: function() {
		if (this.props.data === undefined) return <div />
		else return (
				<div className="temperature-chart-container">
					<ChartParams setChartParam={this.setChartParam} chartParams={this.state.chartParams} weatherData={this.props.weatherData} />
					<div className="temperature-chart" ref={this.initChart} />
				</div>
			)
	}
})

export default PressureChart