import numpy as np
import csv
from datetime import datetime
import timeit
import json
from pyexcel_ods import get_data

# Class definition
class myObject():
	def __init__(self, date = "", value = ""):
		self.DATE = date
		self.VALUE = value

# ref: http://stackoverflow.com/questions/635483
class nestedDict(dict):
    def __missing__(self, key):
        value = self[key] = type(self)()
        return value

allData = nestedDict()

# import csv file
with open('csv_2016_station_7.csv', 'r') as f:
	reader = csv.reader(f)
	inFile = list(reader)
	inData = inFile[1:][:]

title = []
# inData[i][0]: Date, inData[i][1]: Station ID, inData[i][2]: Type of Data, i
# 24-hours data: inData[i][3] ~ inData[i][26]
for i in range(len(inData)):
	today = datetime.strptime(inData[i][0], '%Y/%m/%d')
	if(inData[i][2] not in title):
		title.append(inData[i][2])
	for j in range(24):
		# purify value
		if ('#' in inData[i][3+j]):
			inData[i][3+j] = inData[i][3+j].replace('#','')
		if ('*' in inData[i][3+j]):
			inData[i][3+j] = inData[i][3+j].replace('*','')
		if ('x' in inData[i][3+j]):
			inData[i][3+j] = inData[i][3+j].replace('x','')
		# Normalize the format of date: yyyy/mm/dd/hh
		myDate = str(today.year) + "/" + str(today.month) + "/" + str(today.day)
		# Save as a dictionary: allData[ID][Type][Date] = value
		if (allData[inData[i][1]][myDate][inData[i][2]] == {}):
			allData[inData[i][1]][myDate][inData[i][2]] = []
		if(not(inData[i][3+j] == "" or inData[i][3+j] == "NR" or float(inData[i][3+j]) < 0)):
			allData[inData[i][1]][myDate][inData[i][2]].append(float(inData[i][3+j]))

allDataCSV = []
for i in allData:
	for j in allData[i]:	# date
		oneDayData = []
		for k in title:		# type
			if(len(allData[i][j][k]) == 0):
				allData[i][j][k] = 0
			else:
				allData[i][j][k] = sum(allData[i][j][k]) / len(allData[i][j][k])
			oneDayData.append(allData[i][j][k])
			print(i + "," + j + "," + k + ", avg=" + str(allData[i][j][k]))
		oneDayData.append(j)
		allDataCSV.append(oneDayData)

title.append("DATE")
print(title)

# Write data in a csv file
with open('scatter_plot_matrix_year_' + str(today.year) + '_station' + inData[0][1] + '.csv', 'w', newline = '') as f:
	writer = csv.writer(f)
	writer.writerows([title])
	writer.writerows(allDataCSV)