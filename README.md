# jquery-carousel - simple jQuery Carousel

## Description

Simple, customizable and small jquery based carousel. Supports javascript and/or CSS animation.

## Options

Name        | Type       | Default    | Description
:---------- | :--------- | :--------- | :-----------
item        | string     | a          | carousel item - html element
arrows      | boolean/string | true   | boolean show carousel arrows / or carousel arrows element id
arrowsClass | string     | carousel-arrows | carousel arrows parent element class
pager       | boolean/string | false  | show carousel pagination element
pagerClass  | string     | null       | carousel pagination parent element class
perPage     | int        | 1          | carousel items per page
rows        | int        | 1          | number of rows in carousel containing items
move        | int/string | 1          | amount of space to move - % of view or
pause       | int        | null       | enable automatic rotation
speed       | int        | 1          | movement speed, more is slower
endless     | boolean    | false      | enable endless rotation
cssOnly     | boolean    | false      | use CSS animation - disable js animate
sameSize    | boolean    | false      | is every carousel item same size
swipe       | boolean    | true       | enable mouse/touch swipe
direction   | string     | horizontal | "horizontal" or "vertical"