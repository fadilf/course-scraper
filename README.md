# Course Util
A utility for course planning at Rice University and dataset for playing around.

## The utility
The utility can be seen [here](https://fadileledath.com/course-util/web-interface/) and is used to see when courses have historically been offered.

## The dataset
The dataset is scraped using Python using two separate Jupyter notebooks and collated using a third notebook. It consists of:
- Course catalogs (./catalog/): All courses offered in a single academic year going back to the 2003-2004 academic year in CSV format.
- Course schedules (./schedule/): All courses offered in a Fall/Spring/Summer semester going back to Summer 2004 in CSV format.

The collated data is assembled for the past 10 years but can be done going back further by pulling and modifying the "Course Collation Processor.ipynb" file to create your own dataset.
