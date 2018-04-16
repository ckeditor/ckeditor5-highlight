/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module highlight/highlightediting
 */

import HighlightCommand from './highlightcommand';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AttributeElement from '@ckeditor/ckeditor5-engine/src/view/attributeelement';

import { downcastAttributeToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import { upcastElementToAttribute } from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';

/**
 * The highlight editing feature. It introduces the {@link module:highlight/highlightcommand~HighlightCommand command} and the `highlight`
 * attribute in the {@link module:engine/model/model~Model model} which renders in the {@link module:engine/view/view view}
 * as a `<mark>` element with a `class` attribute (`<mark class="marker-green">...</mark>`) depending
 * on the {@link module:highlight/highlight~HighlightConfig configuration}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class HighlightEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'highlight', {
			options: [
				{
					model: 'yellowMarker',
					class: 'marker-yellow',
					title: 'Yellow marker',
					color: 'var(--ck-highlight-marker-yellow)',
					type: 'marker'
				},
				{
					model: 'greenMarker',
					class: 'marker-green',
					title: 'Green marker',
					color: 'var(--ck-highlight-marker-green)',
					type: 'marker'
				},
				{
					model: 'pinkMarker',
					class: 'marker-pink',
					title: 'Pink marker',
					color: 'var(--ck-highlight-marker-pink)',
					type: 'marker'
				},
				{
					model: 'blueMarker',
					class: 'marker-blue',
					title: 'Blue marker',
					color: 'var(--ck-highlight-marker-blue)',
					type: 'marker'
				},
				{
					model: 'redPen',
					class: 'pen-red',
					title: 'Red pen',
					color: 'var(--ck-highlight-pen-red)',
					type: 'pen'
				},
				{
					model: 'greenPen',
					class: 'pen-green',
					title: 'Green pen',
					color: 'var(--ck-highlight-pen-green)',
					type: 'pen'
				}
			]
		} );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Allow highlight attribute on text nodes.
		editor.model.schema.extend( '$text', { allowAttributes: 'highlight' } );

		const options = editor.config.get( 'highlight.options' );

		// Prepare model to view conversion.
		editor.conversion.for( 'downcast' ).add( _buildDowncastDefinition( options ) );

		// Prepare view to model conversion.
		for ( const definition of _buildUpcastDefinitions( options ) ) {
			editor.conversion.for( 'upcast' ).add( definition );
		}

		editor.commands.add( 'highlight', new HighlightCommand( editor ) );
	}
}

// Converts the options array to the downcast converter definition.
//
// @param {Array.<module:highlight/highlight~HighlightOption>} options An array with configured options.
// @returns {module:engine/conversion/conversion~ConverterDefinition}
function _buildDowncastDefinition( options ) {
	const definition = {
		model: {
			key: 'highlight',
			values: []
		},
		view: {}
	};

	for ( const option of options ) {
		definition.model.values.push( option.model );

		definition.view[ option.model ] = ( modelAttributeValue, viewWriter ) => {
			const attributes = { class: option.class };

			// Highlight element has to have higher priority than other view elements because it must sticks directly to the text.
			// See: https://github.com/ckeditor/ckeditor5-highlight/issues/17.
			const options = { priority: AttributeElement.DEFAULT_PRIORITY + 5 };

			return viewWriter.createAttributeElement( 'mark', attributes, options );
		};
	}

	return downcastAttributeToElement( definition );
}

// Converts the options array to the upcast converter definition.
//
// @param {Array.<module:highlight/highlight~HighlightOption>} options An array with configured options.
// @returns {Array.<module:engine/conversion/conversion~ConverterDefinition>}
function _buildUpcastDefinitions( options ) {
	return options.map( option => {
		return upcastElementToAttribute( {
			model: {
				key: 'highlight',
				value: option.model
			},
			view: {
				name: 'mark',
				classes: option.class
			}
		} );
	} );
}
