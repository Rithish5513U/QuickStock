import { moderateScale, verticalScale, scale } from 'react-native-size-matters';

export const widthScale = (size: number) => scale(size) * 0.70;

export const heightScale = (size: number) => verticalScale(size) * 0.70;

export const mediumScale = (size: number, factor = 0.2) => moderateScale(size, factor);