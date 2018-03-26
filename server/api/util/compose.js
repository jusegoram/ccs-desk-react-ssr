export default (...fns) => fns.reverse().reduce((prevFn, nextFn) => value => nextFn(prevFn(value)), value => value)
